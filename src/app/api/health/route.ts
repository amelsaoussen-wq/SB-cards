import { sql } from "drizzle-orm";
import { db } from "@/db";
import { safeEnsureDatabaseReady } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
  } catch (error) {
    console.error("[health] database unreachable", error);
    return Response.json({ ok: false, database: false }, { status: 500 });
  }

  const ready = await safeEnsureDatabaseReady();
  return Response.json({ ok: true, database: true, schema: ready });
}
