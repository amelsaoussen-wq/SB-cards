import { notFound } from "next/navigation";
import { getPublicCard } from "@/lib/cards";
import { safeEnsureDatabaseReady } from "@/db/bootstrap";
import { getOrigin } from "@/lib/origin";
import { qrDataUrl } from "@/lib/qr";
import { CardBack, CardFront } from "@/components/card-artwork";
import { AutoPrint } from "@/components/auto-print";

export const dynamic = "force-dynamic";

export const metadata = { title: "Exporter en PDF — SB Cards" };

export default async function PrintCardPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await safeEnsureDatabaseReady();
  const card = await getPublicCard(code);
  if (!card) notFound();

  const origin = await getOrigin();
  const shareUrl = `${origin}/c/${card.shareCode}`;
  const qr = await qrDataUrl(shareUrl);

  const artwork = {
    diagnosis: card.diagnosis,
    questionLabel: card.questionLabel,
    clues: card.clues.map((c) => c.body),
    logoInitials: card.logoInitials,
    footerLabel: card.footerLabel,
    socialUrl: card.socialUrl,
    shareUrl,
    specialty: card.specialty,
  };

  return (
    <div className="min-h-screen bg-blush-50 px-4 py-6">
      <AutoPrint />
      <div className="print-sheet flex flex-wrap items-start justify-center gap-6">
        <CardFront {...artwork} className="print-card w-full max-w-[420px]" />
        <CardBack {...artwork} qrDataUrl={qr} className="print-card w-full max-w-[420px]" />
      </div>
    </div>
  );
}
