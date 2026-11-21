import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listFeed } from "@/lib/community";
import { PublicCardTile } from "@/components/public-card-tile";
import { engagementForCards } from "@/lib/engagement";
import { platformAnswerStats, publishedDiagnosisPool } from "@/lib/quiz";
import { EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mes abonnements — SB Cards" };

export default async function FeedPage() {
  const user = await requireUser();
  const cards = await listFeed(user.id);
  const engagement = await engagementForCards(cards.map((c) => c.id), user.id);
  const platform = await platformAnswerStats();
  const pool = await publishedDiagnosisPool();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communauté"
        title="Mes abonnements"
        description="Les dernières cartes publiées par les chaînes que vous suivez. Tout enrichit la bibliothèque SB Cards."
        actions={
          <Link href="/explore" className="sb-btn-primary">
            Découvrir des chaînes
          </Link>
        }
      />

      {cards.length === 0 ? (
        <EmptyState
          icon="📡"
          title="Votre flux est vide pour l’instant"
          description="Suivez des chaînes pour retrouver ici toutes leurs nouvelles cartes. Explorez la bibliothèque de la marque et abonnez-vous à vos créateurs préférés."
          action={
            <Link href="/explore" className="sb-btn-primary">
              Explorer la bibliothèque
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <PublicCardTile key={card.id} card={card} engagement={engagement.get(card.id) ?? { likes: 0, comments: 0, liked: false }} loggedIn pool={pool} platform={platform} />
          ))}
        </div>
      )}
    </div>
  );
}
