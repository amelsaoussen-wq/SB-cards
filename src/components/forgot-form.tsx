"use client";

import Link from "next/link";
import { useState } from "react";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [demoLink, setDemoLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      if (res.ok) {
        setDone(true);
        setEmailSent(!!d.emailSent);
        setDemoLink(d.demoLink ?? null);
      } else {
        setError(d.error ?? "Erreur. Réessayez.");
      }
    } catch {
      setError("Connexion impossible. Réessayez.");
    }
    setBusy(false);
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        {emailSent ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            📧 Un e-mail de réinitialisation vous a été envoyé. Ouvrez-le et
            cliquez sur le lien (valable 30 minutes).
          </p>
        ) : demoLink ? (
          <div className="rounded-xl border border-gold-300/60 bg-[linear-gradient(150deg,#fffaf0,#fdf0f6)] px-4 py-3 text-sm text-plum-900/75">
            <p className="font-semibold text-gold-500">
              Mode démonstration (service d’e-mail non configuré)
            </p>
            <p className="mt-1 text-xs">
              Utilisez ce lien pour réinitialiser votre mot de passe :
            </p>
            <Link
              href={demoLink}
              className="mt-2 block break-all font-semibold text-blush-700 underline"
            >
              {demoLink}
            </Link>
          </div>
        ) : (
          <p className="rounded-xl border border-blush-200 bg-blush-50 px-4 py-3 text-sm text-plum-900/70">
            Si un compte existe avec cette adresse, un lien de réinitialisation
            a été envoyé.
          </p>
        )}
        <Link href="/login" className="sb-btn-secondary w-full">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="sb-label">
          Votre adresse e-mail
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@hopital.fr"
          className="sb-input"
        />
      </div>
      <button type="submit" disabled={busy} className="sb-btn-primary w-full py-3">
        {busy ? "Envoi…" : "Envoyer le lien de réinitialisation"}
      </button>
      <Link href="/login" className="block text-center text-sm font-semibold text-blush-700 hover:underline">
        Retour à la connexion
      </Link>
    </form>
  );
}
