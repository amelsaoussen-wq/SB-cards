"use client";

import { useEffect, useState } from "react";
import type { HealthFlash as Flash } from "@/lib/health-flash";
import { Crown } from "@/components/ornaments";

/**
 * Omflash santé à l'entrée de l'app : 5 s puis disparition,
 * cliquable pour lire le sujet complet, ou « Passer ».
 * Apparaît aléatoirement (pas à chaque navigation).
 */
export function HealthFlash() {
  const [flash, setFlash] = useState<Flash | null>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Aléatoire : ~70 % des entrées, une fois par session.
    if (sessionStorage.getItem("sb-flash-shown")) return;
    if (Math.random() > 0.7) {
      sessionStorage.setItem("sb-flash-shown", "skip");
      return;
    }
    sessionStorage.setItem("sb-flash-shown", "1");
    let active = true;
    fetch("/api/health-flash")
      .then((r) => r.json())
      .then((d) => {
        if (active && d.ok) {
          setFlash(d.flash);
          setVisible(true);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!visible || expanded) return;
    const t = setTimeout(() => setVisible(false), 30000);
    return () => clearTimeout(t);
  }, [visible, expanded]);

  if (!flash || !visible) return null;

  return (
    <>
      <div className="sb-fade-up relative overflow-hidden rounded-2xl border border-gold-300/60 bg-[linear-gradient(120deg,#fffaf0,#fdf0f6_60%,#fbe4ef)] p-4 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-blush-200">
            <Crown className="absolute -top-2 h-4 w-7" />
            <span className="text-lg">{flash.emoji}</span>
          </span>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="min-w-0 flex-1 text-left"
            title="Lire le sujet complet"
          >
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-gold-500">
              {flash.tag} · SB Cards
            </p>
            <p className="font-serif text-sm font-bold text-plum-900">
              {flash.title}
            </p>
            <p className="mt-0.5 line-clamp-4 text-xs leading-relaxed text-plum-900/65">
              {flash.full}
            </p>
            <p className="mt-1 text-[0.62rem] font-semibold text-blush-600">
              👆 Appuyez pour lire en grand · disparaît dans 30 s
            </p>
          </button>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="shrink-0 rounded-full px-2 py-1 text-[0.65rem] font-semibold text-plum-900/45 hover:bg-white hover:text-blush-700"
          >
            Passer ✕
          </button>
        </div>
        {!expanded && (
          <div className="absolute bottom-0 left-0 h-0.5 w-full bg-blush-100">
            <div className="sb-flash-bar h-full bg-[linear-gradient(90deg,#e2569a,#dfa02f)]" />
          </div>
        )}
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/60 p-4 backdrop-blur-sm"
          onClick={() => {
            setExpanded(false);
            setVisible(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="sb-fade-up relative w-full max-w-md overflow-hidden rounded-3xl border border-gold-300/70 bg-[linear-gradient(160deg,#fffaf0,#fdf0f6)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-3xl">{flash.emoji}</span>
            <p className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-gold-500">
              {flash.tag} · SB Cards
            </p>
            <h2 className="mt-1 font-serif text-xl font-bold leading-snug text-plum-900">
              {flash.title}
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-plum-900/75">
              {flash.full}
            </p>
            <p className="mt-3 text-[0.65rem] text-plum-900/40">
              Information générale de santé publique — ne remplace pas un avis
              médical.
            </p>
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setVisible(false);
              }}
              className="sb-btn-primary mt-4 w-full"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
