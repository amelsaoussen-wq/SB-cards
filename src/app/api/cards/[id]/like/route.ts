import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { likes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { likeCard, unlikeCard } from "@/lib/engagement";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function count(cardId: string): Promise<number> {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(likes)
    .where(eq(likes.cardId, cardId));
  return r?.n ?? 0;
}

export async function POST(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Session expirée." }, { status: 401 });
  }
  const { id } = await params;
  await likeCard(user.id, id);
  return Response.json({ ok: true, liked: true, likes: await count(id) });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Session expirée." }, { status: 401 });
  }
  const { id } = await params;
  await unlikeCard(user.id, id);
  return Response.json({ ok: true, liked: false, likes: await count(id) });
}
