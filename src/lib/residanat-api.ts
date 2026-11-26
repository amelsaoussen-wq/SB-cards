import "server-only";
import { ensureDatabaseReady } from "@/db/bootstrap";
import { ensureResidanatSchema } from "@/db/residanat-bootstrap";
import type { SessionUser } from "@/lib/auth";
import { authorizeResidanat } from "@/lib/residanat-access";
import { QcmError } from "@/lib/residanat";

export async function readQcmJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (text.length > 40000) throw new QcmError("Le formulaire est trop volumineux.", 413);
  try { return JSON.parse(text); }
  catch { throw new QcmError("Le formulaire n’est pas valide.", 400); }
}

export async function withResidanat(request: Request, handler: (user: SessionUser) => Promise<Response>): Promise<Response> {
  let response: Response;
  try {
    const auth = await authorizeResidanat(request);
    if (auth.response) response = auth.response;
    else {
      await ensureDatabaseReady();
      await ensureResidanatSchema();
      response = await handler(auth.user);
    }
  } catch (error) {
    if (error instanceof QcmError) response = Response.json({ error: error.message }, { status: error.status });
    else {
      console.error("[residanat] request failed");
      response = Response.json({ error: "Impossible de terminer la demande. Vos données enregistrées sont conservées ; réessayez." }, { status: 503 });
    }
  }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Vary", "Cookie");
  return response;
}
