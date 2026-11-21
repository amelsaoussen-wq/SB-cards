import { listLikers } from "@/lib/engagement";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const likers = await listLikers(id);
  return Response.json({ ok: true, likers });
}
