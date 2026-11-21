import "server-only";

import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { attempts, cards } from "@/db/schema";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 4 choix : le bon diagnostic + 3 leurres tirés d'autres cartes publiées. */
export async function buildOptions(
  cardId: string,
  diagnosis: string,
): Promise<string[]> {
  const others = await db
    .select({ diagnosis: cards.diagnosis })
    .from(cards)
    .where(and(eq(cards.status, "published"), ne(cards.id, cardId)))
    .limit(40);
  const pool = Array.from(
    new Set(others.map((o) => o.diagnosis).filter((d) => d !== diagnosis)),
  );
  const distractors = shuffle(pool).slice(0, 3);
  return shuffle([diagnosis, ...distractors]);
}

export async function recordAttempt(
  cardId: string,
  userId: string | null,
  correct: boolean,
): Promise<void> {
  await db.insert(attempts).values({ cardId, userId, correct });
}

export type AnswerStats = { correct: number; wrong: number };

/** Compteur global de la plateforme : bonnes vs mauvaises réponses. */
export async function platformAnswerStats(): Promise<AnswerStats> {
  const [row] = await db
    .select({
      correct: sql<number>`count(*) filter (where ${attempts.correct})::int`,
      wrong: sql<number>`count(*) filter (where not ${attempts.correct})::int`,
    })
    .from(attempts);
  return { correct: row?.correct ?? 0, wrong: row?.wrong ?? 0 };
}

export async function cardAnswerStats(cardId: string): Promise<AnswerStats> {
  const [row] = await db
    .select({
      correct: sql<number>`count(*) filter (where ${attempts.correct})::int`,
      wrong: sql<number>`count(*) filter (where not ${attempts.correct})::int`,
    })
    .from(attempts)
    .where(eq(attempts.cardId, cardId));
  return { correct: row?.correct ?? 0, wrong: row?.wrong ?? 0 };
}
