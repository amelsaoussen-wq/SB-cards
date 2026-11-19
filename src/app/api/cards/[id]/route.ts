import { getCurrentUser } from "@/lib/auth";
import {
  deleteCard,
  parseCardInput,
  setCardStatus,
  updateCard,
} from "@/lib/card-mutations";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function authenticate() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      response: Response.json(
        { ok: false, error: "Session expirée." },
        { status: 401 },
      ),
    };
  }
  return { user, response: null };
}

export async function PUT(request: Request, { params }: Params) {
  const { user, response } = await authenticate();
  if (!user) return response;
  const { id } = await params;

  let input = null;
  try {
    input = parseCardInput(await request.json());
  } catch {
    input = null;
  }
  if (!input) {
    return Response.json({ ok: false, error: "Données invalides." }, { status: 400 });
  }

  const result = await updateCard(user.id, id, input);
  return Response.json(
    result.ok ? { ok: true, id: result.id } : { ok: false, error: result.error },
    { status: result.ok ? 200 : (result.status ?? 400) },
  );
}

export async function PATCH(request: Request, { params }: Params) {
  const { user, response } = await authenticate();
  if (!user) return response;
  const { id } = await params;

  let status: "draft" | "published" = "draft";
  try {
    const body = (await request.json()) as { status?: string };
    status = body.status === "published" ? "published" : "draft";
  } catch {
    return Response.json({ ok: false, error: "Données invalides." }, { status: 400 });
  }

  const result = await setCardStatus(user.id, id, status);
  return Response.json(
    result.ok ? { ok: true } : { ok: false, error: result.error },
    { status: result.ok ? 200 : (result.status ?? 400) },
  );
}

export async function DELETE(_request: Request, { params }: Params) {
  const { user, response } = await authenticate();
  if (!user) return response;
  const { id } = await params;

  const result = await deleteCard(user.id, id);
  return Response.json(
    result.ok ? { ok: true } : { ok: false, error: result.error },
    { status: result.ok ? 200 : (result.status ?? 400) },
  );
}
