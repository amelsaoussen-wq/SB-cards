import "server-only";

import { db } from "@/db";
import { authAttempts } from "@/db/schema";

/**
 * Journalise chaque tentative de connexion / inscription (email, résultat,
 * navigateur). Purement diagnostique — n'interrompt jamais le flux si la
 * journalisation échoue.
 */
export async function logAuthAttempt(
  kind: "login" | "register",
  email: string,
  ok: boolean,
  userAgent: string,
): Promise<void> {
  try {
    await db.insert(authAttempts).values({
      email: email.slice(0, 160),
      kind,
      ok: ok ? 1 : 0,
      userAgent: userAgent.slice(0, 300),
    });
  } catch {
    /* la journalisation ne doit jamais bloquer l'authentification */
  }
}
