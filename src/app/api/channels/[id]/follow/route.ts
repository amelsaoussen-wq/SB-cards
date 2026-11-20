import { getCurrentUser } from "@/lib/auth";
import { followChannel, unfollowChannel } from "@/lib/community";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Session expirée." }, { status: 401 });
  }
  const { id } = await params;
  if (id === user.id) {
    return Response.json({ ok: false, error: "Vous ne pouvez pas vous suivre." }, { status: 400 });
  }
  await followChannel(user.id, id);
  return Response.json({ ok: true, following: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Session expirée." }, { status: 401 });
  }
  const { id } = await params;
  await unfollowChannel(user.id, id);
  return Response.json({ ok: true, following: false });
}
