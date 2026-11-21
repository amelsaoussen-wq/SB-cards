import { getCurrentUser } from "@/lib/auth";
import { addComment, listComments } from "@/lib/engagement";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  const { id } = await params;
  const items = await listComments(id, user?.id);
  return Response.json({ ok: true, comments: items });
}

export async function POST(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Session expirée." }, { status: 401 });
  }
  const { id } = await params;
  let body = "";
  try {
    const data = (await request.json()) as { body?: string };
    body = String(data.body ?? "");
  } catch {
    return Response.json({ ok: false, error: "Données invalides." }, { status: 400 });
  }
  const created = await addComment(user.id, id, body);
  if (!created) {
    return Response.json({ ok: false, error: "Commentaire vide." }, { status: 400 });
  }
  return Response.json({ ok: true, comment: created });
}
