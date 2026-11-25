import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cards, clues, users } from "@/db/schema";
import { DEMO_EMAIL } from "@/db/bootstrap";
import { newShareCode } from "@/lib/password";
import { TONE_COUNT } from "@/lib/constants";
import type { CardInput } from "@/lib/card-types";

export type MutationResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; status?: number };

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function parseCardInput(raw: unknown): CardInput | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;
  const rawClues = Array.isArray(input.clues) ? input.clues : [];
  const clues = Array.from({ length: TONE_COUNT }, (_, index) =>
    str(rawClues[index]),
  );

  return {
    id: typeof input.id === "string" && input.id ? input.id : undefined,
    diagnosis: str(input.diagnosis),
    questionLabel: str(input.questionLabel, "Quel est le diagnostic ?"),
    specialty: str(input.specialty, "Médecine materno-fœtale"),
    difficulty: str(input.difficulty, "Intermédiaire"),
    status: input.status === "published" ? "published" : "draft",
    summary: str(input.summary),
    logoInitials: str(input.logoInitials, "SB"),
    footerLabel: str(input.footerLabel, "Suivez notre page sur Facebook"),
    socialUrl: str(input.socialUrl, "https://www.facebook.com/"),
    clues,
  };
}

function validate(input: CardInput): string | null {
  if (input.diagnosis.trim().length < 3) {
    return "Le diagnostic doit contenir au moins 3 caractères.";
  }
  if (input.questionLabel.trim().length < 3) {
    return "La question d’amorçage est obligatoire.";
  }
  if (input.clues.length !== TONE_COUNT) {
    return `La carte doit contenir exactement ${TONE_COUNT} indices.`;
  }
  if (input.clues.some((clue) => clue.trim().length < 3)) {
    return "Chaque indice doit contenir au moins 3 caractères.";
  }
  return null;
}

export async function createCard(
  userId: string,
  input: CardInput,
): Promise<MutationResult> {
  const error = validate(input);
  if (error) return { ok: false, error, status: 400 };

  try {
    const id = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(cards)
        .values({
          userId,
          diagnosis: input.diagnosis.trim(),
          questionLabel: input.questionLabel.trim(),
          specialty: input.specialty,
          difficulty: input.difficulty,
          status: input.status,
          publishedAt: input.status === "published" ? new Date() : null,
          summary: input.summary.trim(),
          shareCode: newShareCode(input.diagnosis),
          logoInitials: (input.logoInitials || "SB").trim().slice(0, 3).toUpperCase(),
          footerLabel: input.footerLabel.trim() || "Suivez notre page sur Facebook",
          socialUrl: input.socialUrl.trim() || "https://www.facebook.com/",
        })
        .returning({ id: cards.id });

      if (!created) throw new Error("insert failed");

      await tx.insert(clues).values(
        input.clues.map((body, index) => ({
          cardId: created.id,
          position: index + 1,
          body: body.trim(),
        })),
      );
      return created.id;
    });

    return { ok: true, id };
  } catch (cause) {
    console.error("[createCard]", cause);
    return { ok: false, error: "L’enregistrement a échoué. Réessayez.", status: 500 };
  }
}

export async function updateCard(
  userId: string,
  cardId: string,
  input: CardInput,
): Promise<MutationResult> {
  const error = validate(input);
  if (error) return { ok: false, error, status: 400 };

  try {
    const owned = await db
      .select({ id: cards.id })
      .from(cards)
      .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
      .limit(1);

    if (owned.length === 0) {
      return { ok: false, error: "Cette carte est introuvable.", status: 404 };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(cards)
        .set({
          diagnosis: input.diagnosis.trim(),
          questionLabel: input.questionLabel.trim(),
          specialty: input.specialty,
          difficulty: input.difficulty,
          status: input.status,
          publishedAt: input.status === "published" ? sql`coalesce(${cards.publishedAt}, now())` : cards.publishedAt,
          summary: input.summary.trim(),
          logoInitials: (input.logoInitials || "SB").trim().slice(0, 3).toUpperCase(),
          footerLabel: input.footerLabel.trim() || "Suivez notre page sur Facebook",
          socialUrl: input.socialUrl.trim() || "https://www.facebook.com/",
          updatedAt: new Date(),
        })
        .where(and(eq(cards.id, cardId), eq(cards.userId, userId)));

      await tx.delete(clues).where(eq(clues.cardId, cardId));
      await tx.insert(clues).values(
        input.clues.map((body, index) => ({
          cardId,
          position: index + 1,
          body: body.trim(),
        })),
      );
    });

    return { ok: true, id: cardId };
  } catch (cause) {
    console.error("[updateCard]", cause);
    return { ok: false, error: "L’enregistrement a échoué. Réessayez.", status: 500 };
  }
}

export async function deleteCard(
  userId: string,
  cardId: string,
  isOwner = false,
): Promise<MutationResult> {
  try {
    // Le propriétaire peut supprimer n'importe quelle carte (modération).
    await db
      .delete(cards)
      .where(isOwner ? eq(cards.id, cardId) : and(eq(cards.id, cardId), eq(cards.userId, userId)));
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de supprimer cette carte.", status: 500 };
  }
}

export async function setCardStatus(
  userId: string,
  cardId: string,
  status: "draft" | "published",
): Promise<MutationResult> {
  try {
    await db
      .update(cards)
      .set({ status, updatedAt: new Date(), publishedAt: status === "published" ? sql`coalesce(${cards.publishedAt}, now())` : cards.publishedAt })
      .where(and(eq(cards.id, cardId), eq(cards.userId, userId)));
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de changer le statut.", status: 500 };
  }
}

export async function duplicateCard(
  userId: string,
  cardId: string,
): Promise<MutationResult> {
  try {
    const rows = await db
      .select()
      .from(cards)
      .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
      .limit(1);
    const source = rows[0];
    if (!source) return { ok: false, error: "Carte introuvable.", status: 404 };

    const sourceClues = await db
      .select({ position: clues.position, body: clues.body })
      .from(clues)
      .where(eq(clues.cardId, cardId))
      .orderBy(clues.position);

    const duplicatedId = await db.transaction(async (tx) => {
      const [copy] = await tx
        .insert(cards)
        .values({
          userId,
          diagnosis: `${source.diagnosis} (copie)`,
          questionLabel: source.questionLabel,
          specialty: source.specialty,
          difficulty: source.difficulty,
          status: "draft",
          summary: source.summary,
          shareCode: newShareCode(source.diagnosis),
          logoInitials: source.logoInitials,
          footerLabel: source.footerLabel,
          socialUrl: source.socialUrl,
        })
        .returning({ id: cards.id });

      if (!copy) throw new Error("insert failed");

      if (sourceClues.length > 0) {
        await tx.insert(clues).values(
          sourceClues.map((clue) => ({
            cardId: copy.id,
            position: clue.position,
            body: clue.body,
          })),
        );
      }
      return copy.id;
    });

    return { ok: true, id: duplicatedId };
  } catch {
    return { ok: false, error: "Impossible de dupliquer cette carte.", status: 500 };
  }
}

/**
 * Importe les six cas de démonstration dans l'espace de travail de l'utilisateur.
 * Idempotent : ne fait rien si l'utilisateur possède déjà des cartes.
 */
export async function importStarterCards(userId: string): Promise<number> {
  const existing = await db
    .select({ id: cards.id })
    .from(cards)
    .where(eq(cards.userId, userId))
    .limit(1);
  if (existing.length > 0) return 0;

  const demoRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, DEMO_EMAIL))
    .limit(1);
  const demo = demoRows[0];
  if (!demo) return 0;

  const sources = await db.select().from(cards).where(eq(cards.userId, demo.id));
  let imported = 0;

  for (const source of sources) {
    const sourceClues = await db
      .select({ position: clues.position, body: clues.body })
      .from(clues)
      .where(eq(clues.cardId, source.id))
      .orderBy(clues.position);

    await db.transaction(async (tx) => {
      const [copy] = await tx
        .insert(cards)
        .values({
          userId,
          diagnosis: source.diagnosis,
          questionLabel: source.questionLabel,
          specialty: source.specialty,
          difficulty: source.difficulty,
          status: "published",
          summary: source.summary,
          shareCode: newShareCode(source.diagnosis),
          logoInitials: source.logoInitials,
          footerLabel: source.footerLabel,
          socialUrl: source.socialUrl,
        })
        .returning({ id: cards.id });

      if (!copy) throw new Error("insert failed");

      if (sourceClues.length > 0) {
        await tx.insert(clues).values(
          sourceClues.map((clue) => ({
            cardId: copy.id,
            position: clue.position,
            body: clue.body,
          })),
        );
      }
    });
    imported += 1;
  }

  return imported;
}
