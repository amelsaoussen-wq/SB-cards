import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCard } from "@/lib/cards";
import { getOrigin } from "@/lib/origin";
import { qrDataUrl } from "@/lib/qr";
import { CardBack, CardFront } from "@/components/card-artwork";
import { PrintControls } from "@/components/print-controls";
import { ClueDots, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PreviewCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const card = await getCard(user.id, id);
  if (!card) notFound();

  const origin = await getOrigin();
  const shareUrl = `${origin}/c/${card.shareCode}`;
  const qr = await qrDataUrl(shareUrl);

  const artwork = {
    diagnosis: card.diagnosis,
    questionLabel: card.questionLabel,
    clues: card.clues.map((clue) => clue.body),
    logoInitials: card.logoInitials,
    footerLabel: card.footerLabel,
    socialUrl: card.socialUrl,
    shareUrl,
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={`/dashboard/cards/${card.id}`}
            className="text-xs font-semibold text-blush-700 hover:underline"
          >
            ← Retour à l’éditeur
          </Link>
          <h1 className="mt-2 font-serif text-[1.7rem] font-bold leading-tight text-plum-900 sm:text-[2rem]">
            Aperçu recto / verso
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={card.status} />
            <span className="sb-chip">{card.specialty}</span>
            <span className="rounded-full border border-blush-100 bg-white px-2 py-1 text-[0.65rem] font-semibold text-plum-900/50">
              {card.difficulty}
            </span>
            <span className="text-xs text-plum-900/40">
              Mise à jour le {formatDate(card.updatedAt)}
            </span>
          </div>
        </div>
        <PrintControls cardId={card.id} shareUrl={shareUrl} />
      </div>

      {card.status !== "published" && (
        <div className="no-print rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Cette carte est un brouillon : le QR code et le lien public ne
          fonctionnent pas encore. Publiez-la depuis l’éditeur pour les activer.
        </div>
      )}

      <div className="print-sheet flex flex-wrap items-start justify-center gap-6 rounded-3xl border border-blush-200/60 bg-[linear-gradient(140deg,#fff8fb,#fdf1f6)] p-5 sm:p-8">
        <CardFront {...artwork} className="print-card w-full max-w-[420px]" />
        <CardBack {...artwork} qrDataUrl={qr} className="print-card w-full max-w-[420px]" />
      </div>

      <div className="no-print grid gap-4 lg:grid-cols-3">
        <div className="sb-panel p-5 lg:col-span-2">
          <h2 className="font-serif text-lg font-bold text-plum-900">
            Contenu de la carte
          </h2>
          <p className="mt-1 text-sm text-plum-900/55">
            {card.summary || "Aucun résumé pédagogique renseigné."}
          </p>
          <div className="mt-4 rounded-2xl border border-gold-300/60 bg-[linear-gradient(150deg,#fffaf0,#fdf0f6)] px-4 py-3">
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-gold-500">
              Diagnostic
            </p>
            <p className="mt-1 font-serif text-base font-bold text-plum-900">
              {card.diagnosis}
            </p>
          </div>
          <ol className="mt-4 space-y-2">
            {card.clues.map((clue) => (
              <li key={clue.id} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blush-100 text-xs font-bold text-blush-700">
                  {clue.position}
                </span>
                <span className="leading-relaxed text-plum-900/75">
                  {clue.body}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-4">
          <div className="sb-panel p-5">
            <h2 className="font-serif text-lg font-bold text-plum-900">Partage</h2>
            <p className="mt-1 text-xs text-plum-900/50">
              Le QR code du verso renvoie vers cette adresse publique.
            </p>
            <p className="mt-3 break-all rounded-xl bg-blush-50 px-3 py-2 text-[0.7rem] text-plum-900/60">
              {shareUrl}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href={`/c/${card.shareCode}`}
                target="_blank"
                className="sb-btn-secondary text-xs"
              >
                Ouvrir la page publique ↗
              </Link>
              <Link
                href={`/dashboard/cards/${card.id}`}
                className="sb-btn-primary text-xs"
              >
                Modifier le diagnostic & les indices
              </Link>
            </div>
          </div>

          <div className="sb-panel p-5">
            <h2 className="font-serif text-lg font-bold text-plum-900">
              Statistiques
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-plum-900/55">Scans QR</dt>
                <dd className="font-bold text-plum-900">
                  {card.views.toLocaleString("fr-FR")}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-plum-900/55">Impressions</dt>
                <dd className="font-bold text-plum-900">{card.prints}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-plum-900/55">Indices</dt>
                <dd className="flex items-center gap-2 font-bold text-plum-900">
                  <ClueDots count={card.clues.length} /> {card.clues.length}/6
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
