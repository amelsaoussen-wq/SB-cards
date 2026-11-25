"use client";

import { useState } from "react";

/**
 * La réponse (diagnostic) : cliquer dessus affiche l'explication
 * « pourquoi ce diagnostic » rédigée par le créateur.
 */
export function ExplainAnswer({
  diagnosis,
  explanation,
}: {
  diagnosis: string;
  explanation: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto w-full max-w-[320px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full rounded-2xl border border-gold-300/60 bg-[linear-gradient(150deg,#fffaf0,#fdf0f6)] px-3 py-2 text-center transition hover:brightness-[1.03]"
      >
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-gold-500">
          Réponse
        </p>
        <p className="mt-1 font-serif text-sm font-bold leading-snug text-plum-900">
          {diagnosis}
        </p>
        <p className="mt-1 text-[0.62rem] font-semibold text-blush-600">
          {open ? "▲ Masquer l’explication" : "💡 Cliquez pour lire l’explication"}
        </p>
      </button>
      {open && (
        <div className="sb-fade-up mt-2 rounded-xl border border-blush-200 bg-white px-3 py-2 text-left">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-blush-600">
            Pourquoi ce diagnostic ?
          </p>
          <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-plum-900/75">
            {explanation.trim() ||
              "Aucune explication rédigée pour cette carte pour le moment."}
          </p>
        </div>
      )}
    </div>
  );
}
