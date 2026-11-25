import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { cards, clues } from "@/db/schema";
import type { CardStatus } from "@/lib/constants";

export type CardClue = {
  id: string;
  position: number;
  body: string;
};

export type CardRecord = {
  id: string;
  diagnosis: string;
  questionLabel: string;
  specialty: string;
  difficulty: string;
  status: CardStatus;
  summary: string;
  shareCode: string;
  logoInitials: string;
  footerLabel: string;
  socialUrl: string;
  views: number;
  prints: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  clues: CardClue[];
};

export type CardSummary = Omit<CardRecord, "clues"> & {
  clues: CardClue[];
};

const cardColumns = {
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
  publishedAt: cards.publishedAt,
};

type CardRowLike = {
  id: string;
  diagnosis: string;
  questionLabel: string;
  specialty: string;
  difficulty: string;
  status: string;
  summary: string;
  shareCode: string;
  logoInitials: string;
  footerLabel: string;
  socialUrl: string;
  views: number;
  prints: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

function normalize(row: CardRowLike, clueRows: CardClue[]): CardRecord {
  return {
    ...row,
    status: row.status === "published" ? "published" : "draft",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    clues: clueRows,
  };
}

async function cluesForCards(cardIds: string[]): Promise<Map<string, CardClue[]>> {
  const map = new Map<string, CardClue[]>();
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

export async function listCards(
  userId: string,
  options: { search?: string; status?: string; specialty?: string } = {},
): Promise<CardSummary[]> {
  const filters = [eq(cards.userId, userId)];
  if (options.status === "draft" || options.status === "published") {
    filters.push(eq(cards.status, options.status));
  }
  if (options.specialty) {
    filters.push(eq(cards.specialty, options.specialty));
  }
  if (options.search) {
    const term = `%${options.search.toLowerCase()}%`;
    filters.push(
      sql`(lower(${cards.diagnosis}) LIKE ${term} OR lower(${cards.summary}) LIKE ${term} OR lower(${cards.specialty}) LIKE ${term})`,
    );
  }

  const rows = await db
    .select(cardColumns)
    .from(cards)
    .where(and(...filters))
    .orderBy(desc(cards.updatedAt));

  const clueMap = await cluesForCards(rows.map((row) => row.id));
  return rows.map((row) => ({
    ...normalize(row, clueMap.get(row.id) ?? []),
  }));
}

export async function getCard(
  userId: string,
  cardId: string,
): Promise<CardRecord | null> {
  const rows = await db
    .select(cardColumns)
    .from(cards)
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const clueRows = await db
    .select({ id: clues.id, position: clues.position, body: clues.body })
    .from(clues)
    .where(eq(clues.cardId, cardId))
    .orderBy(clues.position);

  return normalize(row, clueRows);
}

export async function getPublicCard(
  shareCode: string,
): Promise<CardRecord | null> {
  const rows = await db
    .select(cardColumns)
    .from(cards)
    .where(eq(cards.shareCode, shareCode))
    .limit(1);

  const row = rows[0];
  if (!row || row.status !== "published") return null;

  const clueRows = await db
    .select({ id: clues.id, position: clues.position, body: clues.body })
    .from(clues)
    .where(eq(clues.cardId, row.id))
    .orderBy(clues.position);

  return normalize(row, clueRows);
}

export type WorkspaceStats = {
  total: number;
  published: number;
  drafts: number;
  views: number;
  prints: number;
  specialties: { name: string; count: number }[];
};

export async function getWorkspaceStats(
  userId: string,
): Promise<WorkspaceStats> {
  const rows = await db
    .select({
      status: cards.status,
      count: sql<number>`count(*)::int`,
      views: sql<number>`coalesce(sum(${cards.views}), 0)::int`,
      prints: sql<number>`coalesce(sum(${cards.prints}), 0)::int`,
    })
    .from(cards)
    .where(eq(cards.userId, userId))
    .groupBy(cards.status);

  const specialtyRows = await db
    .select({
      name: cards.specialty,
      count: sql<number>`count(*)::int`,
    })
    .from(cards)
    .where(eq(cards.userId, userId))
    .groupBy(cards.specialty)
    .orderBy(desc(sql`count(*)`))
    .limit(4);

  let total = 0;
  let published = 0;
  let drafts = 0;
  let views = 0;
  let prints = 0;
  for (const row of rows) {
    total += row.count;
    views += row.views;
    prints += row.prints;
    if (row.status === "published") published += row.count;
    else drafts += row.count;
  }

  return {
    total,
    published,
    drafts,
    views,
    prints,
    specialties: specialtyRows.map((row) => ({
      name: row.name,
      count: row.count,
    })),
  };
}

export async function incrementCardViews(cardId: string): Promise<void> {
  await db
    .update(cards)
    .set({ views: sql`${cards.views} + 1` })
    .where(eq(cards.id, cardId));
}

export async function incrementCardPrints(
  userId: string,
  cardId: string,
): Promise<void> {
  await db
    .update(cards)
    .set({ prints: sql`${cards.prints} + 1` })
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)));
}
