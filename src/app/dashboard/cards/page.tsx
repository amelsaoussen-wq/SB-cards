import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listCards } from "@/lib/cards";
import { CardsBoard } from "@/components/cards-board";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mes cartes — SB Cards" };

type SearchParams = {
  q?: string;
  status?: string;
  specialty?: string;
  import?: string;
};

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const allCards = await listCards(user.id);

  const query = (params.q ?? "").trim();
  const status = params.status === "draft" || params.status === "published" ? params.status : "";
  const specialty = params.specialty ?? "";

  const specialties = Array.from(
    new Set(allCards.map((card) => card.specialty)),
  ).sort((a, b) => a.localeCompare(b, "fr"));

  const needle = query.toLowerCase();
  const cards = allCards.filter((card) => {
    if (status && card.status !== status) return false;
    if (specialty && card.specialty !== specialty) return false;
    if (!needle) return true;
    return [card.diagnosis, card.summary, card.specialty, ...card.clues.map((c) => c.body)]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bibliothèque"
        title="Mes cartes cliniques"
        description="Chaque carte conserve le modèle rose & or. Modifiez le diagnostic, les six indices, puis publiez pour activer le QR code."
        actions={
          <>
            <Link href="/dashboard/templates" className="sb-btn-secondary">
              Voir le modèle
            </Link>
            <Link href="/dashboard/cards/new" className="sb-btn-primary">
              ＋ Nouvelle carte
            </Link>
          </>
        }
      />

      {params.import === "ok" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Les cas de démonstration ont été importés dans votre espace ✦
        </div>
      )}
      {params.import === "error" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          L’import des exemples a échoué. Réessayez depuis le tableau de bord.
        </div>
      )}

      <CardsBoard
        cards={cards}
        query={query}
        status={status}
        specialty={specialty}
        specialties={specialties}
        totalCount={allCards.length}
      />
    </div>
  );
}
