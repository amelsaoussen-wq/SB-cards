import { getCurrentUser } from "@/lib/auth";
import { incrementCardPrints } from "@/lib/cards";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const { id } = await params;
  await incrementCardPrints(user.id, id);
  return Response.json({ ok: true });
}
