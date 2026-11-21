"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Crown } from "@/components/ornaments";

/**
 * Message de bienvenue affiché une seule fois, juste après la première
 * inscription : « أهلاً بك 🎉 لقد أصبحت فردًا من عائلة SB Cards ».
 */
export function WelcomeModal() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  if (!open) return null;

  function close() {
    setOpen(false);
    router.replace("/dashboard");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenue"
    >
      <div className="sb-fade-up relative w-full max-w-md overflow-hidden rounded-3xl border border-gold-300/70 bg-[linear-gradient(160deg,#fffaf0,#fdf0f6)] p-7 text-center shadow-2xl">
        <div className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-full bg-blush-200/50 blur-2xl" />
        <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-gold-300/40 blur-2xl" />

        <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white ring-1 ring-blush-200">
          <Crown className="absolute -top-3.5 h-7 w-11" />
          <span className="font-serif text-2xl font-black italic text-blush-700">SB</span>
        </span>

        <p className="mt-4 text-4xl" aria-hidden="true">🎉</p>

        <h2 dir="rtl" className="mt-2 font-serif text-2xl font-bold leading-snug text-plum-900">
          أهلاً بك 🎉
          <span className="mt-1 block text-lg text-blush-700">
            لقد أصبحت فردًا من عائلة SB Cards
          </span>
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-plum-900/60">
          Bienvenue dans la famille SB Cards ! Créez votre première carte
          clinique, ou explorez la bibliothèque de la communauté.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button type="button" onClick={close} className="sb-btn-primary w-full py-3">
            ابدأ · Commencer
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.replace("/explore");
            }}
            className="sb-btn-ghost w-full"
          >
            Découvrir la bibliothèque
          </button>
        </div>
      </div>
    </div>
  );
}
