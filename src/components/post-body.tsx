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
  front: ReactNode;
  reveal: ReactNode;
}) {
  const [mode, setMode] = useState<"quiz" | "reveal">("quiz");

  const toggle = (
    <div
      className="flex items-center rounded-full border border-blush-200 bg-white p-0.5"
      role="group"
      aria-label="Mode de réponse"
    >
      <button
        type="button"
        onClick={() => setMode("quiz")}
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
        onClick={() => setMode("reveal")}
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

  return (
    <div className="w-full">
      {mode === "quiz" ? (
        <QuizPost cardId={cardId} options={options} initialPlatform={initialPlatform}>
          {front}
        </QuizPost>
      ) : (
        <div className="flex justify-center">{front}</div>
      )}

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

      {mode === "reveal" && (
        <div className="mt-6">
          <RevealAnswer>{reveal}</RevealAnswer>
        </div>
      )}
    </div>
  );
}
