import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeEnsureDatabaseReady } from "@/db/bootstrap";
import { getChannel, isFollowing } from "@/lib/community";
import { PublicCardTile } from "@/components/public-card-tile";
import { FollowButton } from "@/components/follow-button";
import { Crown } from "@/components/ornaments";
import { EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await safeEnsureDatabaseReady();
  const data = await getChannel(id);
  if (!data) notFound();

  const user = await getCurrentUser();
  const following = user ? await isFollowing(user.id, id) : false;
  const isSelf = user?.id === id;

  const { channel, cardCount, followerCount, cards } = data;

  return (
    <div className="sb-app-bg min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-5">
        <Link href="/explore" className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white ring-1 ring-blush-200">
            <Crown className="absolute -top-2.5 h-5 w-8" />
            <span className="font-serif text-lg font-black italic text-blush-700">SB</span>
          </span>
          <span className="font-serif text-lg font-bold text-plum-900">SB Cards</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/explore" className="sb-btn-ghost">Découvrir</Link>
          {user ? (
            <Link href="/dashboard" className="sb-btn-primary">Mon studio</Link>
          ) : (
            <Link href="/register" className="sb-btn-primary">Créer un compte</Link>
          )}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-16">
        <section className="sb-panel flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(140deg,#e2569a,#a72c69)] font-serif text-xl font-bold text-white">
              {channel.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}
            </span>
            <div>
              <h1 className="font-serif text-2xl font-bold text-plum-900">{channel.name}</h1>
              <p className="text-sm text-plum-900/55">{channel.clinic || channel.role}</p>
              <p className="mt-1 text-xs text-plum-900/45">
                {cardCount} carte{cardCount > 1 ? "s" : ""} publiée{cardCount > 1 ? "s" : ""} ·{" "}
                {followerCount} abonné{followerCount > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSelf ? (
              <Link href="/dashboard/cards" className="sb-btn-secondary">Gérer ma chaîne</Link>
            ) : (
              <FollowButton channelId={id} initialFollowing={following} loggedIn={!!user} />
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-serif text-lg font-bold text-plum-900">Cartes publiées</h2>
          {cards.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Cette chaîne n’a pas encore publié"
                description="Revenez bientôt, ou explorez les autres chaînes de la communauté."
                action={<Link href="/explore" className="sb-btn-primary">Découvrir</Link>}
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
