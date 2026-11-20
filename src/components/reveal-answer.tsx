"use client";

import { useState, type ReactNode } from "react";

/**
 * Sur la page publique, la réponse (diagnostic) est masquée par défaut.
 * L'utilisateur clique sur le bouton sous la publication pour la révéler.
 * N'affecte PAS l'impression / PDF (qui utilise la page d'aperçu dédiée).
 */
export function RevealAnswer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="sb-fade-up flex w-full flex-col items-center gap-6">
        {children}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-3 rounded-3xl border border-dashed border-blush-300 bg-white/70 px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(140deg,#fbe4ef,#f7d0e3)] text-2xl ring-1 ring-blush-200">
        🔒
      </span>
      <p className="font-serif text-lg font-bold text-plum-900">
        La réponse est masquée
      </p>
      <p className="max-w-sm text-sm leading-relaxed text-plum-900/60">
        Réfléchissez aux six indices, puis révélez le diagnostic lorsque vous
        êtes prêt.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sb-btn-primary mt-1 px-6 py-3"
      >
        👁 Révéler la réponse
      </button>
    </div>
  );
}
