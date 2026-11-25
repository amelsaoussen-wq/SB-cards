"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Barre de navigation inférieure : apparaît quand on descend dans la page
 * ( Découvrir / listes longues ) pour naviguer sans remonter en haut.
 */
export function BottomBar({ loggedIn }: { loggedIn: boolean }) {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 260);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  const item = (href: string, label: string, icon: string, active: boolean) => (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[0.6rem] font-semibold transition ${
        active ? "bg-blush-100 text-blush-700" : "text-plum-900/55 hover:bg-blush-50"
      }`}
    >
      <span className="text-base leading-none" aria-hidden="true">{icon}</span>
      {label}
    </Link>
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="sb-fade-up mx-auto flex max-w-lg items-center gap-1 rounded-2xl border border-blush-200 bg-white/95 p-1.5 shadow-[0_-8px_30px_-12px_rgba(90,23,57,0.35)] backdrop-blur">
        {item("/explore", "Découvrir", "🧭", pathname === "/explore")}
        {item(loggedIn ? "/dashboard" : "/login", "Studio", "🎛", pathname.startsWith("/dashboard"))}
        {item(loggedIn ? "/dashboard/feed" : "/login", "Abonnements", "📡", pathname === "/dashboard/feed")}
        {item(loggedIn ? "/dashboard/cards/new" : "/register", "Créer", "＋", pathname === "/dashboard/cards/new")}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Revenir en haut"
          className="flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[0.6rem] font-semibold text-plum-900/55 transition hover:bg-blush-50"
        >
          <span className="text-base leading-none" aria-hidden="true">↑</span>
          Haut
        </button>
      </div>
    </div>
  );
}
