import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { safeEnsureDatabaseReady } from "@/db/bootstrap";
import {
  followedChannelIds,
  listChannels,
  listPublishedCards,
} from "@/lib/community";
import { PublicCardTile } from "@/components/public-card-tile";
import { FollowButton } from "@/components/follow-button";
import { Crown } from "@/components/ornaments";
import { EmptyState } from "@/components/ui";
import { SPECIALTIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Découvrir — SB Cards" };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; specialty?: string }>;
}) {
  await safeEnsureDatabaseReady();
  const user = await getCurrentUser();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const specialty = params.specialty ?? "";

  const [cards, channels, followed] = await Promise.all([
    listPublishedCards({ search: q, specialty }),
    listChannels(10),
    user ? followedChannelIds(user.id) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <div className="sb-app-bg min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white ring-1 ring-blush-200">
            <Crown className="absolute -top-2.5 h-5 w-8" />
            <span className="font-serif text-lg font-black italic text-blush-700">SB</span>
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-lg font-bold text-plum-900">SB Cards</span>
            <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-blush-500">
              Bibliothèque de la marque
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard/feed" className="sb-btn-ghost hidden sm:inline-flex">
                Mes abonnements
              </Link>
              <Link href="/dashboard" className="sb-btn-primary">Mon studio</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="sb-btn-ghost">Connexion</Link>
              <Link href="/register" className="sb-btn-primary">Créer un compte</Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-16">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-plum-900 sm:text-4xl">
            Toutes les cartes de la communauté
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-plum-900/60">
            Chaque créateur publie sur sa propre chaîne, mais toutes les cartes
            enrichissent la bibliothèque SB Cards. Suivez vos chaînes préférées
            pour retrouver leurs nouveautés.
          </p>
        </div>

        <form
          method="get"
          action="/explore"
          className="sb-panel mx-auto mt-6 flex max-w-3xl flex-col gap-2 p-3 sm:flex-row"
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher un diagnostic, une chaîne…"
            className="sb-input flex-1"
            aria-label="Rechercher"
          />
          <select name="specialty" defaultValue={specialty} className="sb-input sm:w-56" aria-label="Spécialité">
            <option value="">Toutes spécialités</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="sb-btn-primary">Rechercher</button>
        </form>

        {channels.length > 0 && (
          <section className="mt-8">
            <h2 className="font-serif text-lg font-bold text-plum-900">Chaînes à suivre</h2>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {channels.map((ch) => (
                <div key={ch.id} className="sb-panel flex min-w-[220px] items-center gap-3 p-3">
                  <Link href={`/ch/${ch.id}`} className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(140deg,#e2569a,#a72c69)] text-xs font-bold text-white">
                      {ch.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-plum-900">{ch.name}</span>
                      <span className="block text-[0.65rem] text-plum-900/45">{ch.cardCount} carte{ch.cardCount > 1 ? "s" : ""}</span>
                    </span>
                  </Link>
                  {user && user.id !== ch.id && (
                    <FollowButton channelId={ch.id} initialFollowing={followed.has(ch.id)} loggedIn={!!user} compact />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="font-serif text-lg font-bold text-plum-900">
            {q || specialty ? "Résultats" : "Dernières publications"}
            <span className="ml-2 text-sm font-normal text-plum-900/40">{cards.length}</span>
          </h2>
          {cards.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon="🔎"
                title="Aucune carte publiée pour le moment"
                description="Aucun résultat. Essayez une autre recherche, ou soyez le premier à publier une carte sur votre chaîne."
                action={
                  user ? (
                    <Link href="/dashboard/cards/new" className="sb-btn-primary">Créer une carte</Link>
                  ) : (
                    <Link href="/register" className="sb-btn-primary">Créer un compte</Link>
                  )
                }
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cards.map((card) => (
                <PublicCardTile key={card.id} card={card} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
