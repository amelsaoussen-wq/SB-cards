import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listCards } from "@/lib/cards";
import { getOrigin } from "@/lib/origin";
import { qrDataUrl } from "@/lib/qr";
import { CardBack, CardFront } from "@/components/card-artwork";
import { PageHeader } from "@/components/ui";
import { CLUE_TONES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "Modèle & design — SB Cards" };

const FALLBACK = {
  diagnosis: "Syndrome de Bart de l’hémoglobine / Alpha-thalassémie majeure",
  questionLabel: "Quel est le diagnostic ?",
  logoInitials: "SB",
  footerLabel: "Suivez notre page sur Facebook",
  socialUrl: "https://www.facebook.com/sb.medical.cards",
  clues: [
    "Une femme de 28 ans, enceinte de 24 semaines, est orientée après une échographie de routine anormale.",
    "Une anémie diagnostiquée dans l’enfance, sans suivi depuis.",
    "Elle et son compagnon sont tous deux originaires du Vietnam.",
    "Anémie microcytaire hypochrome avec un bilan martial normal.",
    "Œdème fœtal massif, ascite et épanchements pleuraux : hydrops fœtal.",
    "Électrophorèse des parents compatible avec un trait thalassémique alpha.",
  ],
};

const LOCKED = [
  "Cadre doré, fond rose dégradé et filigrane SB",
  "Couronne, stéthoscope et étoiles scintillantes",
  "Six pastilles aux couleurs fixes (rose → turquoise)",
  "Question d’amorçage dans une pilule crème",
  "Diagnostic au verso + QR code généré automatiquement",
];

export default async function TemplatesPage() {
  const user = await requireUser();
  const origin = await getOrigin();
  const [sample] = await listCards(user.id, { status: "published" });

  const artwork = sample
    ? {
        diagnosis: sample.diagnosis,
        questionLabel: sample.questionLabel,
        clues: sample.clues.map((clue) => clue.body),
        logoInitials: sample.logoInitials,
        footerLabel: sample.footerLabel,
        socialUrl: sample.socialUrl,
        shareUrl: `${origin}/c/${sample.shareCode}`,
      }
    : { ...FALLBACK, shareUrl: `${origin}/c/apercu` };

  const qr = await qrDataUrl(artwork.shareUrl);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Design system"
        title="Le modèle rose & or"
        description="Un gabarit unique, verrouillé pour toutes les cartes. Vous choisissez le diagnostic et les six indices : la mise en page ne bouge jamais."
        actions={
          <Link href="/dashboard/cards/new" className="sb-btn-primary">
            Utiliser ce modèle
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="sb-panel p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg font-bold text-plum-900">
                Aperçu du gabarit
              </h2>
              <p className="text-xs text-plum-900/50">
                Exemple généré avec le diagnostic et les indices d’une de vos
                cartes.
              </p>
            </div>
            <span className="sb-chip">Recto / Verso</span>
          </div>

          <div className="mt-5 flex flex-wrap items-start justify-center gap-5 rounded-2xl bg-[linear-gradient(140deg,#fff8fb,#fdf1f6)] p-4 sm:p-6">
            <CardFront {...artwork} className="w-full max-w-[330px]" />
            <CardBack {...artwork} qrDataUrl={qr} className="w-full max-w-[330px]" />
          </div>
        </section>

        <div className="space-y-5">
          <section className="sb-panel p-5">
            <h2 className="font-serif text-lg font-bold text-plum-900">
              Palette des six indices
            </h2>
            <p className="mt-1 text-xs text-plum-900/50">
              L’ordre des couleurs est indissociable de la numérotation.
            </p>
            <ul className="mt-4 space-y-2">
              {CLUE_TONES.map((tone, index) => (
                <li key={tone.name} className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white ring-2 ring-white"
                    style={{ backgroundColor: tone.circle }}
                  >
                    {index + 1}
                  </span>
                  <span
                    className="flex-1 rounded-xl border px-3 py-1.5 text-xs font-semibold text-plum-900/75"
                    style={{ backgroundColor: tone.card, borderColor: tone.border }}
                  >
                    {tone.name}
                  </span>
                  <code className="text-[0.62rem] text-plum-900/35">
                    {tone.circle}
                  </code>
                </li>
              ))}
            </ul>
          </section>

          <section className="sb-panel p-5">
            <h2 className="font-serif text-lg font-bold text-plum-900">
              Éléments verrouillés
            </h2>
            <ul className="mt-3 space-y-2">
              {LOCKED.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs leading-relaxed text-plum-900/70"
                >
                  <span className="mt-0.5 text-blush-500" aria-hidden="true">
                    ✦
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-gold-300/60 bg-[linear-gradient(150deg,#fffaf0,#fdf0f6)] p-5">
            <h2 className="font-serif text-lg font-bold text-plum-900">
              Typographie
            </h2>
            <p className="mt-2 font-serif text-xl font-bold leading-tight text-plum-900">
              Serif éditorial
            </p>
            <p className="text-[0.7rem] text-plum-900/50">
              Iowan Old Style · Palatino · Georgia
            </p>
            <p className="mt-3 text-sm text-plum-900/70">
              Sans-serif pour l’interface et les formulaires.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
