import "server-only";

import { cookies } from "next/headers";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, type UserRow } from "@/db/schema";
import { createToken } from "@/lib/password";

export const SESSION_COOKIE = "sb_session";
const SESSION_DAYS = 30;

export type SessionUser = Pick<
  UserRow,
  "id" | "name" | "email" | "clinic" | "role" | "createdAt"
>;

export async function createSession(userId: string): Promise<void> {
  const token = createToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  // Purge les sessions expirées de cet utilisateur (hygiène de la table).
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
  await db.insert(sessions).values({ token, userId, expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    secure: false,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        clinic: users.clinic,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())),
      )
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return user as SessionUser;
}
