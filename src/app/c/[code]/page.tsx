import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicCard, incrementCardViews } from "@/lib/cards";
import { safeEnsureDatabaseReady } from "@/db/bootstrap";
import { getOrigin } from "@/lib/origin";
import { qrDataUrl } from "@/lib/qr";
import { CardBack, CardFront } from "@/components/card-artwork";
import { Crown } from "@/components/ornaments";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await safeEnsureDatabaseReady();
  const card = await getPublicCard(code);
  return {
    title: card ? `${card.diagnosis} — SB Cards` : "Carte introuvable — SB Cards",
    description: card?.summary,
  };
}

export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await safeEnsureDatabaseReady();
  const card = await getPublicCard(code);
  if (!card) notFound();

  const origin = await getOrigin();
  try {
    await incrementCardViews(card.id);
  } catch {
    /* la vue est un bonus, pas un bloquant */
  }

  const artwork = {
    specialty: card.specialty,
    diagnosis: card.diagnosis,
    questionLabel: card.questionLabel,
    clues: card.clues.map((clue) => clue.body),
    logoInitials: card.logoInitials,
    footerLabel: card.footerLabel,
    socialUrl: card.socialUrl,
    shareUrl: `${origin}/c/${card.shareCode}`,
  };

  const qr = await qrDataUrl(artwork.shareUrl);

  return (
    <div className="sb-app-bg min-h-screen">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white ring-1 ring-blush-200">
            <Crown className="absolute -top-2.5 h-5 w-8" />
            <span className="font-serif text-lg font-black italic text-blush-700">
              {card.logoInitials}
            </span>
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-lg font-bold text-plum-900">
              SB Cards
            </span>
            <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-blush-500">
              Carte partagée
            </span>
          </span>
        </Link>
        <Link href="/register" className="sb-btn-primary text-xs sm:text-sm">
          Créer mes cartes
        </Link>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-16">
        <div className="mb-6 text-center">
          <span className="sb-chip">✦ Cas clinique · {card.specialty}</span>
          <h1 className="mx-auto mt-3 max-w-2xl font-serif text-2xl font-bold leading-tight text-plum-900 sm:text-3xl">
            {card.questionLabel}
          </h1>
          <p className="mt-2 text-sm text-plum-900/55">
            {card.summary ||
              "Six indices pour raisonner — la réponse se trouve au verso."}
          </p>
        </div>

        <div className="flex flex-wrap items-start justify-center gap-6">
          <CardFront {...artwork} className="w-full max-w-[400px]" />
          <CardBack {...artwork} qrDataUrl={qr} className="w-full max-w-[400px]" />
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-gold-300/60 bg-[linear-gradient(150deg,#fffaf0,#fdf0f6)] p-6 text-center">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-gold-500">
            Réponse
          </p>
          <p className="mt-2 font-serif text-xl font-bold leading-snug text-plum-900 sm:text-2xl">
            {card.diagnosis}
          </p>
          <p className="mt-2 text-xs text-plum-900/50">
            {card.clues.length} indices · niveau {card.difficulty} ·{" "}
            {card.views.toLocaleString("fr-FR")} lectures
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-plum-900/60">
            Vous aussi, créez des cartes de raisonnement clinique avec le modèle
            rose &amp; or.
          </p>
          <Link href="/register" className="sb-btn-primary mt-3">
            Ouvrir mon studio SB Cards
          </Link>
        </div>
      </main>
    </div>
  );
}
