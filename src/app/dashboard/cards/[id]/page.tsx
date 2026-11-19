import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCard } from "@/lib/cards";
import { CardEditor } from "@/components/card-editor";
import { getOrigin } from "@/lib/origin";
import { qrDataUrl } from "@/lib/qr";
import type { CardInput } from "@/lib/card-types";

export const dynamic = "force-dynamic";

export default async function EditCardPage({
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

  const initial: CardInput = {
    id: card.id,
    diagnosis: card.diagnosis,
    questionLabel: card.questionLabel,
    specialty: card.specialty,
    difficulty: card.difficulty,
    status: card.status,
    summary: card.summary,
    logoInitials: card.logoInitials,
    footerLabel: card.footerLabel,
    socialUrl: card.socialUrl,
    clues: card.clues.map((clue) => clue.body),
  };

  return (
    <CardEditor
      initial={initial}
      shareUrl={shareUrl}
      qrDataUrl={qr}
      updatedAt={card.updatedAt}
    />
  );
}
