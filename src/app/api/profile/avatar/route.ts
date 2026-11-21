import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_CHARS = 400_000; // ~300 Ko en base64

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "Session expirée." }, { status: 401 });
  }

  let dataUrl = "";
  try {
    const body = (await request.json()) as { dataUrl?: string };
    dataUrl = String(body.dataUrl ?? "");
  } catch {
    return Response.json({ ok: false, error: "Données invalides." }, { status: 400 });
  }

  if (dataUrl === "") {
    await db.update(users).set({ avatar: "" }).where(eq(users.id, user.id));
    return Response.json({ ok: true, avatar: "" });
  }

  if (!/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl)) {
    return Response.json(
      { ok: false, error: "Format d’image non pris en charge (PNG/JPEG/WebP)." },
      { status: 400 },
    );
  }
  if (dataUrl.length > MAX_CHARS) {
    return Response.json(
      { ok: false, error: "Image trop lourde. Choisissez une photo plus petite." },
      { status: 400 },
    );
  }

  await db.update(users).set({ avatar: dataUrl }).where(eq(users.id, user.id));
  return Response.json({ ok: true, avatar: dataUrl });
}
