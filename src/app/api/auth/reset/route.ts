import { consumeResetToken } from "@/lib/reset";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let token = "";
  let password = "";
  try {
    const body = (await request.json()) as { token?: string; password?: string };
    token = String(body.token ?? "");
    password = String(body.password ?? "");
  } catch {
    return Response.json({ ok: false, error: "Données invalides." }, { status: 400 });
  }
  const result = await consumeResetToken(token, password);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
