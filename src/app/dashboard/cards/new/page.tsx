import { requireUser } from "@/lib/auth";
import type { CardInput } from "@/lib/card-types";
import { CardEditor } from "@/components/card-editor";
import { getOrigin } from "@/lib/origin";
import { qrDataUrl } from "@/lib/qr";
import { TONE_COUNT } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nouvelle carte — SB Cards" };

export default async function NewCardPage() {
  await requireUser();
  const origin = await getOrigin();
  const previewUrl = `${origin}/c/apercu`;
  const qr = await qrDataUrl(previewUrl);

  const initial: CardInput = {
    diagnosis: "",
    questionLabel: "Quel est le diagnostic ?",
    specialty: "Médecine materno-fœtale",
    difficulty: "Intermédiaire",
    status: "draft",
    summary: "",
    logoInitials: "SB",
    footerLabel: "Suivez notre page sur Facebook",
    socialUrl: "https://www.facebook.com/sb.medical.cards",
    clues: Array.from({ length: TONE_COUNT }, () => ""),
  };

  return (
    <CardEditor initial={initial} shareUrl={previewUrl} qrDataUrl={qr} />
  );
}
