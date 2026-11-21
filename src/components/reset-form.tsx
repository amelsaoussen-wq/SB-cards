"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function ResetForm() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json();
      if (res.ok && d.ok) setOk(true);
      else setError(d.error ?? "Lien invalide ou expiré.");
    } catch {
      setError("Connexion impossible. Réessayez.");
    }
    setBusy(false);
  }

  if (ok) {
    return (
      <div className="space-y-4 text-center">
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          ✅ Mot de passe mis à jour. Connectez-vous avec votre nouveau mot de
          passe.
        </p>
        <Link href="/login" className="sb-btn-primary w-full py-3">
          Se connecter
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
      {!token && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
          Lien incomplet. Demandez un nouveau lien depuis « Mot de passe
          oublié ».
        </p>
      )}
      <div>
        <label htmlFor="password" className="sb-label">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="sb-input"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="sb-label">
          Confirmer le mot de passe
        </label>
        <input
          id="confirm"
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="sb-input"
        />
      </div>
      <button type="submit" disabled={busy || !token} className="sb-btn-primary w-full py-3">
        {busy ? "Mise à jour…" : "Réinitialiser le mot de passe"}
      </button>
      <Link href="/login" className="block text-center text-sm font-semibold text-blush-700 hover:underline">
        Retour à la connexion
      </Link>
    </form>
  );
}
