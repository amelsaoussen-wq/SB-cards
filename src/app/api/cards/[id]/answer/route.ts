import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cards } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { platformAnswerStats, recordAttempt } from "@/lib/quiz";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();

  let choice = "";
  try {
    const data = (await request.json()) as { choice?: string };
    choice = String(data.choice ?? "").trim();
  } catch {
    return Response.json({ ok: false, error: "Données invalides." }, { status: 400 });
  }
  if (!choice) {
    return Response.json({ ok: false, error: "Choix vide." }, { status: 400 });
  }

  const rows = await db
    .select({ diagnosis: cards.diagnosis })
    .from(cards)
    .where(eq(cards.id, id))
    .limit(1);
  const card = rows[0];
  if (!card) {
    return Response.json({ ok: false, error: "Carte introuvable." }, { status: 404 });
  }

  const correct =
    choice.toLowerCase() === card.diagnosis.trim().toLowerCase();
  await recordAttempt(id, user?.id ?? null, correct);
  const platform = await platformAnswerStats();

  return Response.json({ ok: true, correct, diagnosis: card.diagnosis, platform });
}
