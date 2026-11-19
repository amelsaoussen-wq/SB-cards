"use client";

import { useState, useTransition } from "react";

export function PrintControls({
  cardId,
  shareUrl,
}: {
  cardId?: string;
  shareUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          startTransition(async () => {
            if (cardId) {
              await fetch(`/api/cards/${cardId}/print`, {
                method: "POST",
              }).catch(() => undefined);
            }
            window.print();
          });
        }}
        className="sb-btn-primary"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M7 8V4h10v4M7 18H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v6H7z" />
        </svg>
        Imprimer recto/verso
      </button>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
        className="sb-btn-secondary"
      >
        {copied ? "Lien copié ✓" : "Copier le lien public"}
      </button>
      <p className="w-full text-[0.68rem] leading-relaxed text-plum-900/50">
        Couleurs vives garanties. Si le PDF paraît pâle, activez{" "}
        <span className="font-semibold text-blush-700">
          «&nbsp;Graphiques d’arrière-plan&nbsp;»
        </span>{" "}
        (Background graphics) dans la fenêtre d’impression.
      </p>
    </div>
  );
}
