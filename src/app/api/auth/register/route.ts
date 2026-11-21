import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureDatabaseReady } from "@/db/bootstrap";
import { createSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { logAuthAttempt } from "@/lib/auth-log";
import { isOwnerEmail } from "@/lib/owner";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  let name = "";
  let email = "";
  let clinic = "";
  let password = "";

  try {
    const form = await request.formData();
    name = String(form.get("name") ?? "").trim();
    email = String(form.get("email") ?? "").trim().toLowerCase();
    clinic = String(form.get("clinic") ?? "").trim();
    password = String(form.get("password") ?? "").trim();
  } catch {
    redirect("/register?error=missing");
  }

  if (!name || !email || !password) {
    redirect(`/register?error=missing&email=${encodeURIComponent(email)}`);
  }
  if (!email.includes("@") || email.length < 5) {
    redirect(`/register?error=invalid&email=${encodeURIComponent(email)}`);
  }
  if (password.length < 6) {
    redirect(`/register?error=weak&email=${encodeURIComponent(email)}`);
  }

  try {
    await ensureDatabaseReady();
  } catch (error) {
    console.error("[register] database unavailable", error);
    redirect("/register?error=db");
  }

  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      // Le compte existe : on envoie vers la connexion avec l'e-mail pré-rempli.
      await logAuthAttempt("register", email, false, userAgent);
      redirect(`/login?error=exists&email=${encodeURIComponent(email)}`);
    }

    const [created] = await db
      .insert(users)
      .values({
        name: name.slice(0, 80),
        email,
        clinic: clinic.slice(0, 160),
        passwordHash: hashPassword(password),
        isAdmin: isOwnerEmail(email),
      })
      .returning({ id: users.id });

    if (!created) {
      redirect("/register?error=db");
    }

    await createSession(created.id);
    await logAuthAttempt("register", email, true, userAgent);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[register] failed", error);
    redirect("/register?error=db");
  }

  redirect("/dashboard");
}
