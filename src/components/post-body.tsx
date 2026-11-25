"use client";

import { useState, type ReactNode } from "react";
import { PostActions } from "@/components/post-actions";
import { QuizPost } from "@/components/quiz-post";
import { RevealAnswer } from "@/components/reveal-answer";

/**
 * Corps d'une publication : l'utilisateur choisit, à côté de J'aime /
 * Commentaires, entre deux modes :
 *  - « Options » : quiz à choix multiples (poste vert / rouge).
 *  - « Révéler » : réfléchir puis dévoiler la réponse cachée.
 */
export function PostBody({
  cardId,
  options,
  initialPlatform,
  initialLikes,
  initialLiked,
  initialComments,
  loggedIn,
  printHref,
  explanation,
  front,
  reveal,
}: {
  cardId: string;
  options: string[];
  initialPlatform: { correct: number; wrong: number };
  initialLikes: number;
  initialLiked: boolean;
  initialComments: number;
  loggedIn: boolean;
  printHref: string;
  explanation: string;
  front: ReactNode;
  reveal: ReactNode;
}) {
  // Par défaut RIEN n'est visible : ni options ni réponse.
  // L'utilisateur clique sur 🎯 pour voir les options, ou 👁 pour la réponse.
  const [mode, setMode] = useState<"hidden" | "quiz" | "reveal">("hidden");
  const [full, setFull] = useState(false);

  const toggle = (
    <div
      className="flex items-center rounded-full border border-blush-200 bg-white p-0.5"
      role="group"
      aria-label="Mode de réponse"
    >
      <button
        type="button"
        onClick={() => setMode((m) => (m === "quiz" ? "hidden" : "quiz"))}
        aria-pressed={mode === "quiz"}
        className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold transition ${
          mode === "quiz"
            ? "bg-blush-600 text-white"
            : "text-plum-900/55 hover:text-blush-700"
        }`}
      >
        🎯 Options
      </button>
      <button
        type="button"
        onClick={() => setMode((m) => (m === "reveal" ? "hidden" : "reveal"))}
        aria-pressed={mode === "reveal"}
        className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold transition ${
          mode === "reveal"
            ? "bg-blush-600 text-white"
            : "text-plum-900/55 hover:text-blush-700"
        }`}
      >
        👁 Révéler
      </button>
    </div>
  );

  const sized = <div className="mx-auto w-full max-w-[320px]">{front}</div>;

  return (
    <div className="w-full">
      <div className="relative">
        <button
          type="button"
          onClick={() => setFull(true)}
          title="Plein écran"
          aria-label="Agrandir en plein écran"
          className="absolute right-1 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-plum-900/70 shadow ring-1 ring-blush-200 transition hover:text-blush-700"
        >
          ⛶
        </button>
        {mode === "quiz" ? (
          <QuizPost
            cardId={cardId}
            options={options}
            initialPlatform={initialPlatform}
            explanation={explanation}
          >
            {sized}
          </QuizPost>
        ) : (
          <div className="flex justify-center">{sized}</div>
        )}
      </div>

      <div className="mt-4">
        <PostActions
          cardId={cardId}
          initialLikes={initialLikes}
          initialLiked={initialLiked}
          initialComments={initialComments}
          loggedIn={loggedIn}
          printHref={printHref}
          modeToggle={toggle}
        />
      </div>

      {mode === "hidden" && (
        <p className="mt-3 text-center text-[0.68rem] text-plum-900/45">
          Options masquées — cliquez sur 🎯 Options pour jouer, ou 👁 Révéler
          pour voir la réponse.
        </p>
      )}

      {mode === "reveal" && (
        <div className="mt-6">
          <RevealAnswer>{reveal}</RevealAnswer>
        </div>
      )}

      {full && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/90 p-4 backdrop-blur-sm"
          onClick={() => setFull(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Carte en plein écran"
        >
          <div
            className="relative max-h-[94vh] w-full max-w-[440px] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFull(false)}
              aria-label="Fermer"
              className="absolute right-0 top-0 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-plum-900 shadow"
            >
              ✕
            </button>
            <div className="w-full">{front}</div>
          </div>
        </div>
      )}
    </div>
  );
}
