"use client";

import { useActionState } from "react";
import { updateProfileAction, type AuthState } from "@/lib/actions";

const INITIAL: AuthState = {};

export function SettingsForm({
  name,
  clinic,
  role,
  email,
}: {
  name: string;
  clinic: string;
  role: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
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
          Profil mis à jour ✦
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="sb-label">
            Nom complet
          </label>
          <input
            id="name"
            name="name"
            defaultValue={name}
            required
            minLength={2}
            className="sb-input"
          />
        </div>
        <div>
          <label htmlFor="role" className="sb-label">
            Fonction
          </label>
          <input
            id="role"
            name="role"
            defaultValue={role}
            className="sb-input"
            placeholder="Concepteur de cartes"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="clinic" className="sb-label">
            Établissement / service
          </label>
          <input
            id="clinic"
            name="clinic"
            defaultValue={clinic}
            className="sb-input"
            placeholder="CHU — médecine materno-fœtale"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="email" className="sb-label">
            Adresse e-mail
          </label>
          <input
            id="email"
            value={email}
            disabled
            className="sb-input bg-blush-50/60"
          />
          <p className="mt-1 text-[0.68rem] text-plum-900/40">
            L’adresse de connexion ne peut pas être modifiée dans la démo.
          </p>
        </div>
      </div>

      <button type="submit" disabled={pending} className="sb-btn-primary">
        {pending ? "Enregistrement…" : "Enregistrer le profil"}
      </button>
    </form>
  );
}
