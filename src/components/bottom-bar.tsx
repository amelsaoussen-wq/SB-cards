"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function MedIcon({ d, extra }: { d: string; extra?: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
      {extra}
    </svg>
  );
}

function Crescent() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M15 3a9 9 0 1 0 0 18 7.5 7.5 0 0 1 0-18z" />
    </svg>
  );
}

const ICONS = {
  // سماعة طبية
  discover: (
    <MedIcon d="M6 3v5a4 4 0 0 0 8 0V3M10 12v3a4 4 0 0 0 4 4h1" extra={<circle cx="18" cy="19" r="2.5" />} />
  ),
  // بطاقة طبية بهلال (بدل الصليب)
  studio: (
    <MedIcon
      d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
      extra={<path d="M13.6 8.6a4 4 0 1 0 0 6.8 3.2 3.2 0 0 1 0-6.8z" fill="currentColor" stroke="none" />}
    />
  ),
  // نبض القلب
  feed: (
    <MedIcon d="M12 20C6 15.5 3.5 12 3.5 9.2 3.5 7 5.2 5.3 7.4 5.3c1.7 0 3.2.9 4.6 2.6 1.4-1.7 2.9-2.6 4.6-2.6 2.2 0 3.9 1.7 3.9 3.9 0 2.8-2.5 6.3-8.5 10.8Z" extra={<path d="M7 12h3l1.5-2.5 2 4L15 12h2" />} />
  ),
  // هلال للإنشاء
  create: <Crescent />,
  // صعود للأعلى
  top: <MedIcon d="M12 19V5M6 11l6-6 6 6" />,
};

/**
 * Barre inférieure : n'apparaît que lorsqu'on REMONTE vers le haut
 * (scroll vers le haut), pour offrir le retour en haut + navigation médicale.
 */
export function BottomBar({ loggedIn }: { loggedIn: boolean }) {
  const [visible, setVisible] = useState(false);
  const lastY = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const goingUp = y < lastY.current;
      lastY.current = y;
      if (y <= 260) setVisible(false);
      else setVisible(goingUp);
    };
    lastY.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  const item = (href: string, label: string, icon: React.ReactNode, active: boolean) => (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[0.6rem] font-semibold transition ${
        active ? "bg-blush-100 text-blush-700" : "text-plum-900/55 hover:bg-blush-50"
      }`}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="sb-fade-up mx-auto flex max-w-lg items-center gap-1 rounded-2xl border border-blush-200 bg-white/95 p-1.5 shadow-[0_-8px_30px_-12px_rgba(90,23,57,0.35)] backdrop-blur">
        {item("/explore", "Découvrir", ICONS.discover, pathname === "/explore")}
        {item(loggedIn ? "/dashboard" : "/login", "Studio", ICONS.studio, pathname.startsWith("/dashboard"))}
        {item(loggedIn ? "/dashboard/feed" : "/login", "Abonnements", ICONS.feed, pathname === "/dashboard/feed")}
        {item(loggedIn ? "/dashboard/cards/new" : "/register", "Créer", ICONS.create, pathname === "/dashboard/cards/new")}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Revenir en haut"
          className="flex flex-1 flex-col items-center gap-0.5 rounded-xl bg-blush-600 px-1 py-1.5 text-[0.6rem] font-semibold text-white transition hover:brightness-110"
        >
          {ICONS.top}
          Haut
        </button>
      </div>
    </div>
  );
}
