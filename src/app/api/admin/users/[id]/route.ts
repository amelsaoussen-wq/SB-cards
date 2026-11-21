import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    return Response.json({ ok: false, error: "Réservé au propriétaire." }, { status: 403 });
  }
  const { id } = await params;
  if (id === user.id) {
    return Response.json({ ok: false, error: "Impossible de supprimer votre propre compte." }, { status: 400 });
  }
  await db.delete(users).where(eq(users.id, id));
  return Response.json({ ok: true });
}
