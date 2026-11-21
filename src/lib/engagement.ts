import "server-only";

import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { comments, likes, users } from "@/db/schema";

export type Engagement = { likes: number; comments: number; liked: boolean };

/** Compteurs d'engagement pour une liste de cartes (likes + commentaires + liké par moi). */
export async function engagementForCards(
  cardIds: string[],
  userId?: string,
): Promise<Map<string, Engagement>> {
  const map = new Map<string, Engagement>();
  if (cardIds.length === 0) return map;
  for (const id of cardIds) map.set(id, { likes: 0, comments: 0, liked: false });

  const likeRows = await db
    .select({ cardId: likes.cardId, n: sql<number>`count(*)::int` })
    .from(likes)
    .where(inArray(likes.cardId, cardIds))
    .groupBy(likes.cardId);
  for (const r of likeRows) {
    const e = map.get(r.cardId);
    if (e) e.likes = r.n;
  }

  const commentRows = await db
    .select({ cardId: comments.cardId, n: sql<number>`count(*)::int` })
    .from(comments)
    .where(inArray(comments.cardId, cardIds))
    .groupBy(comments.cardId);
  for (const r of commentRows) {
    const e = map.get(r.cardId);
    if (e) e.comments = r.n;
  }

  if (userId) {
    const mine = await db
      .select({ cardId: likes.cardId })
      .from(likes)
      .where(and(inArray(likes.cardId, cardIds), eq(likes.userId, userId)));
    for (const r of mine) {
      const e = map.get(r.cardId);
      if (e) e.liked = true;
    }
  }

  return map;
}

export async function likeCard(userId: string, cardId: string): Promise<void> {
  await db.insert(likes).values({ userId, cardId }).onConflictDoNothing();
}

export async function unlikeCard(userId: string, cardId: string): Promise<void> {
  await db
    .delete(likes)
    .where(and(eq(likes.userId, userId), eq(likes.cardId, cardId)));
}

export type CommentView = {
  id: string;
  body: string;
  author: string;
  createdAt: string;
  mine: boolean;
};

export async function listComments(
  cardId: string,
  viewerId?: string,
): Promise<CommentView[]> {
  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorId: users.id,
      author: users.name,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(eq(comments.cardId, cardId))
    .orderBy(asc(comments.createdAt))
    .limit(100);
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    author: r.author,
    createdAt: r.createdAt.toISOString(),
    mine: viewerId ? r.authorId === viewerId : false,
  }));
}

export async function addComment(
  userId: string,
  cardId: string,
  body: string,
): Promise<CommentView | null> {
  const trimmed = body.trim().slice(0, 600);
  if (!trimmed) return null;
  const [row] = await db
    .insert(comments)
    .values({ userId, cardId, body: trimmed })
    .returning({ id: comments.id, createdAt: comments.createdAt });
  if (!row) return null;
  const u = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return {
    id: row.id,
    body: trimmed,
    author: u[0]?.name ?? "Membre",
    createdAt: row.createdAt.toISOString(),
    mine: true,
  };
}

export async function deleteComment(
  userId: string,
  commentId: string,
): Promise<void> {
  await db
    .delete(comments)
    .where(and(eq(comments.id, commentId), eq(comments.userId, userId)));
}
