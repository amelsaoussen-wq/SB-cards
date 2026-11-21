"use client";

import { useState, type ReactNode } from "react";

type Result = { correct: boolean; chosen: string; diagnosis: string };

/**
 * Quiz interactif sur la publication : le visiteur choisit une réponse.
 * Bonne réponse → le poste se teinte en VERT ; mauvaise → ROUGE.
 * Affiche le compteur global bonnes/mauvaises réponses de la plateforme.
 */
export function QuizPost({
  cardId,
  options,
  initialPlatform,
  children,
}: {
  cardId: string;
  options: string[];
  initialPlatform: { correct: number; wrong: number };
  children: ReactNode;
}) {
  const [result, setResult] = useState<Result | null>(null);
  const [platform, setPlatform] = useState(initialPlatform);
  const [busy, setBusy] = useState(false);

  async function choose(option: string) {
    if (busy || result) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/cards/${cardId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice: option }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ correct: data.correct, chosen: option, diagnosis: data.diagnosis });
        if (data.platform) setPlatform(data.platform);
      }
    } catch {
      /* ignore */
    }
    setBusy(false);
  }

  const tone = result
    ? result.correct
      ? "bg-emerald-50 ring-4 ring-emerald-400/70"
      : "bg-rose-50 ring-4 ring-rose-400/70"
    : "bg-transparent ring-0";

  return (
    <div className="w-full">
      <div className={`rounded-3xl p-2 transition-all duration-500 ${tone}`}>
        {children}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-center font-serif text-sm font-bold text-plum-900">
          {result ? "Résultat" : "À vous de jouer : quel est le diagnostic ?"}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((opt) => {
            let cls =
              "border-blush-200 bg-white text-plum-900/80 hover:border-blush-400 hover:bg-blush-50";
            if (result) {
              if (opt === result.diagnosis)
                cls = "border-emerald-500 bg-emerald-50 text-emerald-800";
              else if (opt === result.chosen)
                cls = "border-rose-500 bg-rose-50 text-rose-800";
              else cls = "border-blush-100 bg-white text-plum-900/40";
            }
            return (
              <button
                key={opt}
                type="button"
                disabled={!!result || busy}
                onClick={() => choose(opt)}
                className={`rounded-xl border-2 px-3 py-2 text-left text-xs font-semibold leading-snug transition ${cls}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {result && (
          <p
            className={`mt-3 rounded-xl px-3 py-2 text-center text-sm font-bold ${
              result.correct
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {result.correct
              ? "✅ Bonne réponse ! Bravo 🎉"
              : `❌ Mauvaise réponse. La bonne réponse : ${result.diagnosis}`}
          </p>
        )}

        <div className="mt-3 flex items-center justify-center gap-4 rounded-full border border-blush-200 bg-white/80 px-4 py-2 text-xs font-semibold">
          <span className="text-emerald-700">✅ {platform.correct} bonnes</span>
          <span className="text-plum-900/30">·</span>
          <span className="text-rose-700">❌ {platform.wrong} mauvaises</span>
          <span className="text-plum-900/40">(plateforme)</span>
        </div>
      </div>
    </div>
  );
}
