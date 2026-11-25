import "server-only";

import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { attempts, users } from "@/db/schema";

export type DayStar = {
  userId: string;
  name: string;
  avatar: string;
  count: number;
  day: string; // ISO date (UTC) du jour évalué
};

/**
 * « نجم اليوم » : utilisateur avec le plus de bonnes réponses sur une journée.
 * En cas d'égalité, le plus RAPIDE à atteindre ce nombre (dernière bonne
 * réponse la plus précoce) gagne.
 * Le star est publié le lendemain : par défaut on évalue la journée d'hier.
 */
export async function starOfTheDay(offsetDays = -1): Promise<DayStar | null> {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays),
  );
  const end = new Date(start.getTime() + 86_400_000);

  const rows = await db
    .select({
      userId: attempts.userId,
      n: sql<number>`count(*)::int`,
      reached: sql<Date>`max(${attempts.createdAt})`,
    })
    .from(attempts)
    .where(
      and(
        eq(attempts.correct, true),
        gte(attempts.createdAt, start),
        lt(attempts.createdAt, end),
        sql`${attempts.userId} is not null`,
      ),
    )
    .groupBy(attempts.userId)
    .orderBy(sql`count(*) desc`, sql`max(${attempts.createdAt}) asc`)
    .limit(1);

  const top = rows[0];
  if (!top || !top.userId) return null;

  const u = await db
    .select({ name: users.name, avatar: users.avatar })
    .from(users)
    .where(eq(users.id, top.userId))
    .limit(1);
  const user = u[0];
  if (!user) return null;

  return {
    userId: top.userId,
    name: user.name,
    avatar: user.avatar,
    count: top.n,
    day: start.toISOString().slice(0, 10),
  };
}
