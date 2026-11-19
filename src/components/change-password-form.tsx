"use client";

import { useActionState } from "react";
import { changePasswordAction, type AuthState } from "@/lib/actions";

const INITIAL: AuthState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    INITIAL,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
        >
          {state.error}
        </p>
      )}
      {state.ok && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700"
        >
          Mot de passe mis à jour ✦ Utilisez-le à la prochaine connexion.
        </p>
      )}

      <div>
        <label htmlFor="current" className="sb-label">
          Mot de passe actuel
        </label>
        <input
          id="current"
          name="current"
          type="password"
          required
          autoComplete="current-password"
          autoCapitalize="none"
          className="sb-input"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="next" className="sb-label">
            Nouveau mot de passe
          </label>
          <input
            id="next"
            name="next"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            autoCapitalize="none"
            placeholder="6 caractères min."
            className="sb-input"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="sb-label">
            Confirmer
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            autoCapitalize="none"
            placeholder="••••••••"
            className="sb-input"
          />
        </div>
      </div>

      <button type="submit" disabled={pending} className="sb-btn-primary">
        {pending ? "Mise à jour…" : "Changer le mot de passe"}
      </button>
    </form>
  );
}
