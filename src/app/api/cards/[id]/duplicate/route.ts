import { getCurrentUser } from "@/lib/auth";
import { duplicateCard } from "@/lib/card-mutations";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Session expirée." }, { status: 401 });
  }

  const { id } = await params;
  const result = await duplicateCard(user.id, id);
  return Response.json(
    result.ok ? { ok: true, id: result.id } : { ok: false, error: result.error },
    { status: result.ok ? 200 : (result.status ?? 400) },
  );
}
