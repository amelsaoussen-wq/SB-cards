import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getWorkspaceStats, listCards } from "@/lib/cards";
import { CardFront } from "@/components/card-artwork";
import {
  ClueDots,
  EmptyState,
  PageHeader,
  SectionTitle,
  StatCard,
  StatusBadge,
} from "@/components/ui";
import { formatRelative } from "@/lib/format";
import { WelcomeModal } from "@/components/welcome-modal";

export const dynamic = "force-dynamic";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Bonne nuit";
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const [cards, stats] = await Promise.all([
    listCards(user.id),
    getWorkspaceStats(user.id),
  ]);

  const recent = cards.slice(0, 3);
  const maxSpecialty = Math.max(1, ...stats.specialties.map((item) => item.count));

  return (
    <div className="space-y-7">
      {params.welcome === "1" && <WelcomeModal name={user.name} />}
      <PageHeader
        eyebrow="Vue d’ensemble"
        title={`${greeting()}, ${user.name}`}
        description="Votre studio de cartes cliniques. Le modèle rose & or est verrouillé : seuls le diagnostic et les six indices varient."
        actions={
          <>
            <Link href="/dashboard/cards" className="sb-btn-secondary">
              Toutes mes cartes
            </Link>
            <Link href="/dashboard/cards/new" className="sb-btn-primary">
              <span aria-hidden="true">＋</span> Nouvelle carte
            </Link>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Cartes au total"
          value={stats.total}
          hint={`${stats.specialties.length} spécialité${stats.specialties.length > 1 ? "s" : ""} couverte${stats.specialties.length > 1 ? "s" : ""}`}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M7 4h10a2 2 0 0 1 2 2v13l-7-3-7 3V6a2 2 0 0 1 2-2Z" />
            </svg>
          }
        />
        <StatCard
          label="Publiées"
          value={stats.published}
          hint={`${stats.drafts} brouillon${stats.drafts > 1 ? "s" : ""} en cours`}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="m5 13 4 4L19 7" />
            </svg>
          }
        />
        <StatCard
          label="Scans cumulés"
          value={stats.views.toLocaleString("fr-FR")}
          hint="Lectures via QR code"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3M3 12h18" />
            </svg>
          }
        />
        <StatCard
          label="Impressions"
          value={stats.prints.toLocaleString("fr-FR")}
          hint="Versions recto/verso"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M7 8V4h10v4M7 18H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v6H7z" />
            </svg>
          }
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <section className="sb-panel p-5">
          <SectionTitle
            title="Cartes récentes"
            hint="Vos trois dernières créations"
            action={
              <Link
                href="/dashboard/cards"
                className="text-xs font-semibold text-blush-700 hover:underline"
              >
                Tout voir →
              </Link>
            }
          />

          {recent.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Votre studio est encore vide"
                description="Générez votre première carte ou importez les six cas cliniques de démonstration pour démarrer immédiatement."
                action={
                  <>
                    <Link href="/dashboard/cards/new" className="sb-btn-primary">
                      Créer une carte
                    </Link>
                    <form action="/api/cards/import" method="post">
                      <button type="submit" className="sb-btn-secondary">
                        Importer les exemples
                      </button>
                    </form>
                  </>
                }
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {recent.map((card) => (
                <Link
                  key={card.id}
                  href={`/dashboard/cards/${card.id}`}
                  className="group flex flex-col gap-3 rounded-2xl border border-blush-100 bg-blush-50/40 p-3 transition hover:border-blush-300 hover:bg-white"
                >
                  <div className="mx-auto w-full max-w-[180px]">
                    <CardFront
                      specialty={card.specialty}
                      diagnosis={card.diagnosis}
                      questionLabel={card.questionLabel}
                      clues={card.clues.map((clue) => clue.body)}
                      logoInitials={card.logoInitials}
                      footerLabel={card.footerLabel}
                      socialUrl={card.socialUrl}
                      shareUrl={card.shareCode}
                      className="transition duration-300 group-hover:-translate-y-1 group-hover:drop-shadow-xl"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={card.status} />
                      <ClueDots />
                    </div>
                    <p className="mt-2 line-clamp-2 font-serif text-sm font-bold leading-snug text-plum-900">
                      {card.diagnosis}
                    </p>
                    <p className="mt-1 text-[0.7rem] text-plum-900/50">
                      Modifiée {formatRelative(card.updatedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="sb-panel p-5">
            <SectionTitle title="Par spécialité" hint="Répartition de votre catalogue" />
            <div className="mt-4 space-y-3">
              {stats.specialties.length === 0 && (
                <p className="text-sm text-plum-900/50">
                  Aucune carte pour le moment.
                </p>
              )}
              {stats.specialties.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate pr-2 font-medium text-plum-900/75">
                      {item.name}
                    </span>
                    <span className="font-bold text-blush-700">{item.count}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-blush-100">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#e2569a,#dfa02f)]"
                      style={{ width: `${(item.count / maxSpecialty) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-gold-300/60 bg-[linear-gradient(150deg,#fffaf0,#fdf0f6)] p-5">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-gold-500">
              ✦ Modèle unique
            </p>
            <h2 className="mt-2 font-serif text-lg font-bold text-plum-900">
              Le design ne change jamais.
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-plum-900/65">
              Rose &amp; or, couronne, six pastilles colorées, QR code au verso.
              Vous personnalisez uniquement le diagnostic et les indices.
            </p>
            <Link
              href="/dashboard/templates"
              className="mt-4 inline-flex text-xs font-bold text-blush-700 hover:underline"
            >
              Voir le modèle verrouillé →
            </Link>
          </section>

          <section className="sb-panel p-5">
            <SectionTitle title="Activité" hint="Dernières modifications" />
            <ul className="mt-3 space-y-3">
              {cards.slice(0, 4).map((card) => (
                <li key={card.id} className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blush-400" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-plum-900">
                      {card.diagnosis}
                    </p>
                    <p className="text-[0.68rem] text-plum-900/45">
                      {card.status === "published" ? "Publiée" : "Brouillon"} ·{" "}
                      {formatRelative(card.updatedAt)}
                    </p>
                  </div>
                </li>
              ))}
              {cards.length === 0 && (
                <li className="text-sm text-plum-900/50">Rien à afficher.</li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
