import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureDatabaseReady } from "@/db/bootstrap";
import { createSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { logAuthAttempt } from "@/lib/auth-log";

export const dynamic = "force-dynamic";

function safeNext(value: string): string {
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  let email = "";
  let password = "";
  let next = "/dashboard";

  try {
    const form = await request.formData();
    email = String(form.get("email") ?? "").trim().toLowerCase();
    // Les espaces parasites (copier-coller / clavier mobile) sont ignorés.
    password = String(form.get("password") ?? "").trim();
    next = safeNext(String(form.get("next") ?? "/dashboard"));
  } catch {
    redirect("/login?error=missing");
  }

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  try {
    await ensureDatabaseReady();
  } catch (error) {
    console.error("[login] database unavailable", error);
    redirect("/login?error=db");
  }

  try {
    const rows = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = rows[0];
    if (!user || !verifyPassword(password, user.passwordHash)) {
      await logAuthAttempt("login", email, false, userAgent);
      redirect(`/login?error=bad&email=${encodeURIComponent(email)}`);
    }

    await createSession(user.id);
    await logAuthAttempt("login", email, true, userAgent);
  } catch (error) {
    // Les redirections Next.js sont des exceptions : on les laisse passer.
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[login] failed", error);
    redirect("/login?error=db");
  }

  redirect(next);
}
