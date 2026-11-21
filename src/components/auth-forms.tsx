"use client";

import Link from "next/link";
import { useState } from "react";

const MESSAGES: Record<string, string> = {
  missing: "Merci de remplir tous les champs obligatoires.",
  invalid: "Cette adresse e-mail n’est pas valide (ex. nom@hopital.fr).",
  weak: "Le mot de passe doit contenir au moins 6 caractères.",
  exists:
    "Un compte existe déjà avec cette adresse e-mail. Connectez-vous ci-dessous.",
  bad: "E-mail ou mot de passe incorrect. Vérifiez votre saisie.",
  db: "Le service est momentanément indisponible. Réessayez dans quelques secondes.",
};

function ErrorBanner({ code }: { code?: string }) {
  if (!code) return null;
  const message =
    MESSAGES[code] ??
    "La demande n’a pas abouti. Vérifiez les informations saisies.";
  return (
    <p
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700"
    >
      {message}
    </p>
  );
}

function SubmitButton({
  label,
  pendingLabel,
  pending,
}: {
  label: string;
  pendingLabel: string;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      aria-busy={pending}
      className="sb-btn-primary w-full py-3"
    >
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}

function PasswordField({
  id,
  label,
  name,
  defaultValue,
  autoComplete,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue?: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="sb-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          placeholder="••••••••"
          className="sb-input pr-16"
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-blush-600 hover:bg-blush-50"
        >
          {visible ? "Cacher" : "Voir"}
        </button>
      </div>
    </div>
  );
}

export function LoginForm({
  error,
  email: initialEmail,
  next = "/dashboard",
}: {
  error?: string;
  email?: string;
  next?: string;
}) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      action="/api/auth/login"
      method="post"
      onSubmit={(event) => {
        // Ne jamais désactiver le bouton pendant la soumission native
        // (WebKit annule l'envoi si le submitter devient disabled).
        if (pending) {
          event.preventDefault();
          return;
        }
        setPending(true);
      }}
      className="space-y-4"
    >
      {!pending && <ErrorBanner code={error} />}

      <input type="hidden" name="next" value={next} />

      <div>
        <label htmlFor="email" className="sb-label">
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="vous@hopital.fr"
          className="sb-input"
        />
      </div>

      <div>
        <label htmlFor="password" className="sb-label">
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="••••••••"
            className="sb-input pr-16"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-blush-600 hover:bg-blush-50"
          >
            {showPassword ? "Cacher" : "Voir"}
          </button>
        </div>
      </div>

      <div className="text-right">
        <Link
          href="/forgot-password"
          className="text-xs font-semibold text-blush-700 hover:underline"
        >
          Mot de passe oublié ?
        </Link>
      </div>

      <SubmitButton label="Se connecter" pendingLabel="Connexion…" pending={pending} />

      <button
        type="button"
        onClick={() => {
          setEmail("demo@sb-cards.app");
          setPassword("demo1234");
        }}
        className="sb-btn-secondary w-full"
      >
        Remplir le compte de démonstration
      </button>

      <p className="text-center text-sm text-plum-900/60">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-semibold text-blush-700 hover:underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({
  error,
  email: initialEmail,
}: {
  error?: string;
  email?: string;
}) {
  const [pending, setPending] = useState(false);

  return (
    <form
      action="/api/auth/register"
      method="post"
      onSubmit={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }
        setPending(true);
      }}
      className="space-y-4"
    >
      <ErrorBanner code={error} />

      <div>
        <label htmlFor="name" className="sb-label">
          Nom complet *
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          autoComplete="name"
          placeholder="SB Cards"
          className="sb-input"
        />
      </div>

      <div>
        <label htmlFor="email" className="sb-label">
          Adresse e-mail *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={initialEmail}
          placeholder="vous@hopital.fr"
          className="sb-input"
        />
        <p className="mt-1 text-[0.68rem] text-plum-900/40">
          N’importe quelle adresse valide fonctionne : elle sert seulement
          d’identifiant de connexion.
        </p>
      </div>

      <div>
        <label htmlFor="clinic" className="sb-label">
          Établissement{" "}
          <span className="font-normal normal-case">(optionnel)</span>
        </label>
        <input
          id="clinic"
          name="clinic"
          placeholder="CHU — médecine interne"
          className="sb-input"
        />
      </div>

      <PasswordField
        id="password"
        name="password"
        label="Mot de passe * (6 caractères min.)"
        autoComplete="new-password"
      />

      <SubmitButton label="Créer mon studio" pendingLabel="Création…" pending={pending} />

      <p className="text-center text-sm text-plum-900/60">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-semibold text-blush-700 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
