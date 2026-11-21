import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureDatabaseReady } from "@/db/bootstrap";
import { createResetToken, sendResetEmail } from "@/lib/reset";
import { getOrigin } from "@/lib/origin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let email = "";
  try {
    const body = (await request.json()) as { email?: string };
    email = String(body.email ?? "").trim().toLowerCase();
  } catch {
    return Response.json({ ok: false, error: "Données invalides." }, { status: 400 });
  }
  if (!email) {
    return Response.json({ ok: false, error: "E-mail requis." }, { status: 400 });
  }

  await ensureDatabaseReady();
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const user = rows[0];

  // Réponse générique (ne révèle pas l'existence du compte).
  if (!user) {
    return Response.json({ ok: true, emailSent: false });
  }

  const token = await createResetToken(user.id);
  const origin = await getOrigin();
  const link = `${origin}/reset-password?token=${token}`;
  const sent = await sendResetEmail(email, link);

  return Response.json({
    ok: true,
    emailSent: sent,
    // Mode démonstration : aucun service d'e-mail configuré → lien affiché.
    demoLink: sent ? undefined : link,
  });
}
