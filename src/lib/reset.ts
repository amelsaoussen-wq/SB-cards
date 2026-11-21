import "server-only";

import { randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResets, users } from "@/db/schema";
import { hashPassword } from "@/lib/password";

const TTL_MIN = 30;

export async function createResetToken(userId: string): Promise<string> {
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + TTL_MIN * 60_000);
  await db.insert(passwordResets).values({ token, userId, expiresAt });
  return token;
}

export async function consumeResetToken(
  token: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  if (newPassword.trim().length < 6) {
    return { ok: false, error: "Le mot de passe doit contenir au moins 6 caractères." };
  }
  const rows = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.token, token),
        gt(passwordResets.expiresAt, new Date()),
        isNull(passwordResets.usedAt),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) {
    return { ok: false, error: "Lien invalide ou expiré. Demandez un nouveau lien." };
  }
  await db
    .update(users)
    .set({ passwordHash: hashPassword(newPassword.trim()) })
    .where(eq(users.id, row.userId));
  await db
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(eq(passwordResets.token, token));
  return { ok: true };
}

/**
 * Envoie le lien de réinitialisation par e-mail.
 * Supporte Resend (RESEND_API_KEY) ou SMTP (SMTP_HOST/USER/PASS, ex. Gmail).
 * Retourne false si aucun service n'est configuré (mode démonstration).
 */
export async function sendResetEmail(
  to: string,
  link: string,
): Promise<boolean> {
  const subject = "SB Cards — réinitialisation de votre mot de passe";
  const html = `
    <div style="font-family:Georgia,serif;max-width:480px;margin:auto;padding:24px;background:#fdf6f9;border:1px solid #f7d6e5;border-radius:16px">
      <h2 style="color:#a72c69;margin:0 0 8px">SB Cards 🌸</h2>
      <p style="color:#40112b;font-size:14px;line-height:1.6">
        Vous avez demandé à réinitialiser votre mot de passe.
        Cliquez sur le bouton ci-dessous (valable ${TTL_MIN} minutes) :
      </p>
      <p style="text-align:center;margin:24px 0">
        <a href="${link}" style="background:#c22f77;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold;font-size:14px">
          Réinitialiser mon mot de passe
        </a>
      </p>
      <p style="color:#7f2152;font-size:12px;line-height:1.6">
        Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.
        Votre mot de passe actuel reste inchangé.
      </p>
    </div>`;

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESET_EMAIL_FROM || "SB Cards <onboarding@resend.dev>",
          to: [to],
          subject,
          html,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  const smtpHost = process.env.SMTP_HOST;
  if (smtpHost) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.default.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.RESET_EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
      });
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
