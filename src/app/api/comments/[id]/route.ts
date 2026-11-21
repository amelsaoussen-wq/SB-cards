import { getCurrentUser } from "@/lib/auth";
import { deleteComment } from "@/lib/engagement";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Session expirée." }, { status: 401 });
  }
  const { id } = await params;
  await deleteComment(user.id, id);
  return Response.json({ ok: true });
}
