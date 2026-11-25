"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Crown } from "@/components/ornaments";
import { Avatar } from "@/components/avatar";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
};

function Icon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Mon studio",
    exact: true,
    icon: <Icon path="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
  },
  {
    href: "/explore",
    label: "Découvrir",
    icon: (
      <Icon path="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c2.5 2.4 3.8 5.6 3.8 9s-1.3 6.6-3.8 9m0-18C9.5 5.4 8.2 8.6 8.2 12s1.3 6.6 3.8 9M3.5 9h17M3.5 15h17" />
    ),
  },
  {
    href: "/dashboard/feed",
    label: "Mes abonnements",
    icon: (
      <Icon path="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16M5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
    ),
  },
  {
    href: "/dashboard/templates",
    label: "Modèle & design",
    icon: (
      <Icon path="M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 0v18M4 7l8 4 8-4" />
    ),
  },
  {
    href: "/dashboard/settings",
    label: "Paramètres",
    icon: (
      <Icon path="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.5 7.5 0 0 0-2-1.2L14.6 3h-3.9L10.3 5.7a7.5 7.5 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7.5 7.5 0 0 0 2 1.2l.4 2.7h3.9l.4-2.7a7.5 7.5 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.07-.4.1-.8.1-1.2Z" />
    ),
  },
];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function DashboardShell({
  user,
  children,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    clinic: string;
    isAdmin: boolean;
    avatar: string;
  };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link href="/dashboard" className="flex items-center gap-3">
        <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(140deg,#fbeaf2,#f7d0e3)] ring-1 ring-blush-200">
          <Crown className="absolute -top-2.5 h-5 w-8" />
          <span className="font-serif text-lg font-black italic text-blush-700">
            SB
          </span>
        </span>
        <span className="leading-tight">
          <span className="block font-serif text-lg font-bold tracking-tight text-plum-900">
            SB Cards
          </span>
          <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-blush-500">
            Studio médical
          </span>
        </span>
      </Link>

      <Link href="/dashboard/cards/new" className="sb-btn-primary w-full">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M15 3a9 9 0 1 0 0 18 7.5 7.5 0 0 1 0-18z" />
        </svg>
        Nouvelle carte
      </Link>

      <nav className="flex flex-col gap-1" aria-label="Navigation principale">
        {NAV.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-[linear-gradient(100deg,#fbe4ef,#fdf3f8)] text-blush-800 shadow-[inset_0_0_0_1px_rgba(241,184,210,0.7)]"
                  : "text-plum-900/65 hover:bg-blush-50 hover:text-blush-800"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  active
                    ? "bg-white text-blush-600 shadow-sm"
                    : "bg-blush-50 text-blush-500 group-hover:bg-white"
                }`}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
        {user.isAdmin && (
          <Link
            href="/dashboard/admin"
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              pathname.startsWith("/dashboard/admin")
                ? "bg-[linear-gradient(100deg,#fbe4ef,#fdf3f8)] text-blush-800 shadow-[inset_0_0_0_1px_rgba(241,184,210,0.7)]"
                : "text-plum-900/65 hover:bg-blush-50 hover:text-blush-800"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                pathname.startsWith("/dashboard/admin")
                  ? "bg-white text-blush-600 shadow-sm"
                  : "bg-blush-50 text-blush-500 group-hover:bg-white"
              }`}
            >
              <Icon path="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
            </span>
            Administration
          </Link>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <div className="rounded-2xl border border-gold-300/60 bg-[linear-gradient(150deg,#fffaf0,#fdf0f6)] p-3.5">
          <p className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-gold-500">
            <span aria-hidden="true">✦</span> Design verrouillé
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-plum-900/70">
            Le modèle rose &amp; or reste identique sur toutes les cartes. Seuls
            le diagnostic et les 6 indices changent.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-blush-100 bg-blush-50/60 p-2.5">
          <Avatar name={user.name} avatar={user.avatar} className="h-9 w-9 text-xs" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-plum-900">
              {user.name}
            </p>
            <p className="truncate text-[0.7rem] text-plum-900/55">
              {user.email}
            </p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              title="Se déconnecter"
              aria-label="Se déconnecter"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-plum-900/50 transition hover:bg-white hover:text-blush-700"
            >
              <Icon path="M15 12H4m0 0 3.5-3.5M4 12l3.5 3.5M10 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-8" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="sb-app-bg min-h-screen bg-blush-50">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 border-r border-blush-200/70 bg-white/80 backdrop-blur lg:block">
          {sidebar}
        </aside>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-plum-900/40 backdrop-blur-sm"
            />
            <div className="absolute inset-y-0 left-0 w-[286px] bg-white shadow-2xl">
              {sidebar}
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-blush-200/70 bg-blush-50/85 px-4 py-3 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-blush-200 bg-white text-blush-700"
              aria-label="Ouvrir le menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <Crown className="h-4 w-7" />
              <span className="font-serif text-base font-bold text-plum-900">
                SB Cards
              </span>
            </Link>
            <Link
              href="/dashboard/cards/new"
              className="rounded-xl bg-blush-600 px-3 py-2 text-xs font-bold text-white"
            >
              🌙 Carte
            </Link>
          </header>

          <main className="flex-1 px-4 pb-16 pt-5 sm:px-6 lg:px-10 lg:pt-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
