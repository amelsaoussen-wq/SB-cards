"use client";

import { useEffect } from "react";

/**
 * Page dédiée à l'export PDF : ouvre automatiquement la boîte d'impression
 * (le navigateur propose « Enregistrer au format PDF »), avec un bouton manuel.
 */
export function AutoPrint() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="no-print mb-4 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="sb-btn-primary"
      >
        ⬇ Enregistrer en PDF / Imprimer
      </button>
      <p className="w-full text-center text-xs text-plum-900/50">
        Dans la boîte d’impression, choisissez «&nbsp;Enregistrer au format
        PDF&nbsp;» et activez les graphiques d’arrière-plan.
      </p>
    </div>
  );
}
