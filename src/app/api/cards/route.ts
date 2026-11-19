import { getCurrentUser } from "@/lib/auth";
import { ensureDatabaseReady } from "@/db/bootstrap";
import { createCard, parseCardInput } from "@/lib/card-mutations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Session expirée." }, { status: 401 });
  }

  try {
    await ensureDatabaseReady();
  } catch {
    return Response.json(
      { ok: false, error: "Base de données indisponible." },
      { status: 503 },
    );
  }

  let input = null;
  try {
    input = parseCardInput(await request.json());
  } catch {
    input = null;
  }
  if (!input) {
    return Response.json({ ok: false, error: "Données invalides." }, { status: 400 });
  }

  const result = await createCard(user.id, input);
  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.error },
      { status: result.status ?? 400 },
    );
  }

  // Un import de données d'exemple peut demander la publication immédiate.
  return Response.json({ ok: true, id: result.id });
}
