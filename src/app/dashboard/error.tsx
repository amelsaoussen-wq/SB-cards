"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blush-100 text-2xl text-blush-600">
        ✦
      </span>
      <h1 className="mt-4 font-serif text-2xl font-bold text-plum-900">
        Le studio a rencontré un souci
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-plum-900/60">
        Impossible de charger cette section pour le moment. Réessayez, vos
        cartes sont conservées.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={reset} className="sb-btn-primary">
          Réessayer
        </button>
        <Link href="/dashboard" className="sb-btn-secondary">
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
