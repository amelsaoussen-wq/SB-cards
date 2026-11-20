import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { cards, clues, follows, users } from "@/db/schema";
import type { CardRecord } from "@/lib/cards";

export type ChannelInfo = {
  id: string;
  name: string;
  clinic: string;
};

export type CommunityCard = CardRecord & { channel: ChannelInfo };

async function loadClues(cardIds: string[]) {
  const map = new Map<string, { id: string; position: number; body: string }[]>();
  if (cardIds.length === 0) return map;
  const rows = await db
    .select({
      id: clues.id,
      cardId: clues.cardId,
      position: clues.position,
      body: clues.body,
    })
    .from(clues)
    .where(inArray(clues.cardId, cardIds))
    .orderBy(clues.position);
  for (const row of rows) {
    const list = map.get(row.cardId) ?? [];
    list.push({ id: row.id, position: row.position, body: row.body });
    map.set(row.cardId, list);
  }
  return map;
}

const cardCols = {
  id: cards.id,
  diagnosis: cards.diagnosis,
  questionLabel: cards.questionLabel,
  specialty: cards.specialty,
  difficulty: cards.difficulty,
  status: cards.status,
  summary: cards.summary,
  shareCode: cards.shareCode,
  logoInitials: cards.logoInitials,
  footerLabel: cards.footerLabel,
  socialUrl: cards.socialUrl,
  views: cards.views,
  prints: cards.prints,
  createdAt: cards.createdAt,
  updatedAt: cards.updatedAt,
  channelId: users.id,
  channelName: users.name,
  channelClinic: users.clinic,
};

type Row = Awaited<ReturnType<typeof queryRows>>[number];

function queryRows() {
  return db.select(cardCols).from(cards).innerJoin(users, eq(users.id, cards.userId));
}

function toCommunity(row: Row, clueList: CommunityCard["clues"]): CommunityCard {
  return {
    id: row.id,
    diagnosis: row.diagnosis,
    questionLabel: row.questionLabel,
    specialty: row.specialty,
    difficulty: row.difficulty,
    status: row.status === "published" ? "published" : "draft",
    summary: row.summary,
    shareCode: row.shareCode,
    logoInitials: row.logoInitials,
    footerLabel: row.footerLabel,
    socialUrl: row.socialUrl,
    views: row.views,
    prints: row.prints,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    clues: clueList,
    channel: {
      id: row.channelId,
      name: row.channelName,
      clinic: row.channelClinic,
    },
  };
}

/** Bibliothèque publique : toutes les cartes publiées, toutes chaînes confondues. */
export async function listPublishedCards(options: {
  search?: string;
  specialty?: string;
  channelId?: string;
  limit?: number;
} = {}): Promise<CommunityCard[]> {
  const filters = [eq(cards.status, "published")];
  if (options.channelId) filters.push(eq(cards.userId, options.channelId));
  if (options.specialty) filters.push(eq(cards.specialty, options.specialty));
  if (options.search) {
    const term = `%${options.search.toLowerCase()}%`;
    filters.push(
      sql`(lower(${cards.diagnosis}) LIKE ${term} OR lower(${cards.summary}) LIKE ${term} OR lower(${users.name}) LIKE ${term})`,
    );
  }

  const rows = await db
    .select(cardCols)
    .from(cards)
    .innerJoin(users, eq(users.id, cards.userId))
    .where(and(...filters))
    .orderBy(desc(cards.updatedAt))
    .limit(options.limit ?? 60);

  const clueMap = await loadClues(rows.map((r) => r.id));
  return rows.map((r) => toCommunity(r, clueMap.get(r.id) ?? []));
}

/** Chaîne publique d'un utilisateur : ses cartes publiées + stats. */
export async function getChannel(channelId: string) {
  const u = await db
    .select({ id: users.id, name: users.name, clinic: users.clinic, role: users.role })
    .from(users)
    .where(eq(users.id, channelId))
    .limit(1);
  const channel = u[0];
  if (!channel) return null;

  const [cardCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(cards)
    .where(and(eq(cards.userId, channelId), eq(cards.status, "published")));
  const [followerCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(follows)
    .where(eq(follows.channelId, channelId));

  const published = await listPublishedCards({ channelId, limit: 60 });
  return {
    channel,
    cardCount: cardCount?.n ?? 0,
    followerCount: followerCount?.n ?? 0,
    cards: published,
  };
}

/** Flux personnalisé : cartes publiées par les chaînes suivies. */
export async function listFeed(userId: string): Promise<CommunityCard[]> {
  const followed = await db
    .select({ channelId: follows.channelId })
    .from(follows)
    .where(eq(follows.followerId, userId));
  const ids = followed.map((f) => f.channelId);
  if (ids.length === 0) return [];

  const rows = await db
    .select(cardCols)
    .from(cards)
    .innerJoin(users, eq(users.id, cards.userId))
    .where(and(eq(cards.status, "published"), inArray(cards.userId, ids)))
    .orderBy(desc(cards.updatedAt))
    .limit(60);

  const clueMap = await loadClues(rows.map((r) => r.id));
  return rows.map((r) => toCommunity(r, clueMap.get(r.id) ?? []));
}

export async function followedChannelIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ channelId: follows.channelId })
    .from(follows)
    .where(eq(follows.followerId, userId));
  return new Set(rows.map((r) => r.channelId));
}

export async function isFollowing(
  userId: string,
  channelId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: follows.id })
    .from(follows)
    .where(and(eq(follows.followerId, userId), eq(follows.channelId, channelId)))
    .limit(1);
  return rows.length > 0;
}

export async function followChannel(
  userId: string,
  channelId: string,
): Promise<void> {
  if (userId === channelId) return;
  await db
    .insert(follows)
    .values({ followerId: userId, channelId })
    .onConflictDoNothing();
}

export async function unfollowChannel(
  userId: string,
  channelId: string,
): Promise<void> {
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, userId), eq(follows.channelId, channelId)));
}

/** Chaînes actives (ayant publié), pour la découverte. */
export async function listChannels(limit = 12) {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      clinic: users.clinic,
      cardCount: sql<number>`count(${cards.id})::int`,
    })
    .from(users)
    .innerJoin(cards, and(eq(cards.userId, users.id), eq(cards.status, "published")))
    .groupBy(users.id)
    .orderBy(desc(sql`count(${cards.id})`))
    .limit(limit);
  return rows;
}
