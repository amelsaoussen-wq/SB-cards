import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getWorkspaceStats, listCards } from "@/lib/cards";
import { getChannel } from "@/lib/community";
import { CardsBoard } from "@/components/cards-board";
import { Avatar } from "@/components/avatar";
import { PageHeader, StatCard } from "@/components/ui";
import { WelcomeModal } from "@/components/welcome-modal";
import { HealthFlash } from "@/components/health-flash";

export const dynamic = "force-dynamic";

/**
 * « Mon studio » : point d'entrée unique qui regroupe l'aperçu (stats),
 * la chaîne publique du créateur et la gestion/publication de ses cartes.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const [cards, stats, channelData] = await Promise.all([
    listCards(user.id),
    getWorkspaceStats(user.id),
    getChannel(user.id),
  ]);

  const specialties = Array.from(
    new Set(cards.map((c) => c.specialty)),
  ).sort((a, b) => a.localeCompare(b, "fr"));

  return (
    <div className="space-y-6">
      {params.welcome === "1" && <WelcomeModal name={user.name} />}

      <HealthFlash />

      <PageHeader
        eyebrow="Espace créateur"
        title="Mon studio"
        description="Tout au même endroit : votre chaîne, vos statistiques et vos cartes. Publiez en un clic."
        actions={
          <>
            <Link href={`/ch/${user.id}`} className="sb-btn-secondary">
              Ma chaîne publique ↗
            </Link>
            <Link href="/dashboard/cards/new" className="sb-btn-primary">
              ＋ Nouvelle carte
            </Link>
          </>
        }
      />

      {/* Chaîne du créateur */}
      <section className="sb-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            name={user.name}
            avatar={user.avatar}
            className="h-16 w-16 rounded-2xl text-xl"
          />
          <div>
            <p className="flex items-center gap-2 font-serif text-xl font-bold text-plum-900">
              {user.name}
              {user.isAdmin && (
                <span className="rounded-full bg-gold-300/40 px-2 py-0.5 text-[0.6rem] font-bold text-gold-500">
                  👑 Officiel
                </span>
              )}
            </p>
            <p className="text-sm text-plum-900/55">
              {user.clinic || user.role}
            </p>
            <p className="mt-1 text-xs text-plum-900/45">
              {channelData?.cardCount ?? 0} carte
              {(channelData?.cardCount ?? 0) > 1 ? "s" : ""} publiée
              {(channelData?.cardCount ?? 0) > 1 ? "s" : ""} ·{" "}
              {channelData?.followerCount ?? 0} abonné
              {(channelData?.followerCount ?? 0) > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Link href={`/ch/${user.id}`} className="sb-btn-secondary shrink-0">
          Voir ma chaîne
        </Link>
      </section>

      {/* Statistiques */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Cartes au total"
          value={stats.total}
          hint={`${stats.specialties.length} spécialité${stats.specialties.length > 1 ? "s" : ""}`}
          icon={<span aria-hidden="true">🗂</span>}
        />
        <StatCard
          label="Publiées"
          value={stats.published}
          hint={`${stats.drafts} brouillon${stats.drafts > 1 ? "s" : ""}`}
          icon={<span aria-hidden="true">✅</span>}
        />
        <StatCard
          label="Scans cumulés"
          value={stats.views.toLocaleString("fr-FR")}
          hint="Lectures via QR code"
          icon={<span aria-hidden="true">📷</span>}
        />
        <StatCard
          label="Impressions"
          value={stats.prints.toLocaleString("fr-FR")}
          hint="Versions recto/verso"
          icon={<span aria-hidden="true">🖨</span>}
        />
      </section>

      {/* Gestion & publication des cartes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-bold text-plum-900">
            Mes cartes & publication
          </h2>
          <Link
            href="/dashboard/cards/new"
            className="text-xs font-semibold text-blush-700 hover:underline"
          >
            ＋ Créer
          </Link>
        </div>
        <CardsBoard
          cards={cards}
          query=""
          status=""
          specialty=""
          specialties={specialties}
          totalCount={cards.length}
        />
      </section>
    </div>
  );
}
