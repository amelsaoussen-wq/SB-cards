import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { CardBack, CardFront } from "@/components/card-artwork";
import { Crown } from "@/components/ornaments";
import { CLUE_TONES } from "@/lib/constants";
import { qrDataUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

const SAMPLE = {
  specialty: "Médecine materno-fœtale",
  diagnosis:
    "Syndrome de Bart de l’hémoglobine / Alpha-thalassémie majeure",
  questionLabel: "Quel est le diagnostic ?",
  logoInitials: "SB",
  footerLabel: "Suivez notre page sur Facebook",
  socialUrl: "https://www.facebook.com/sb.medical.cards",
  shareUrl: "https://sb-cards.app/c/bart-hemoglobine-alpha-thalassemie",
  clues: [
    "Une femme de 28 ans, enceinte de 24 semaines, est orientée au service de médecine materno-fœtale après une échographie de routine anormale.",
    "On lui a diagnostiqué une anémie dans l’enfance, sans aucun suivi depuis. Elle n’a pas d’autre antécédent.",
    "Elle et son compagnon sont tous deux originaires du Vietnam.",
    "Son hémogramme révèle une anémie microcytaire hypochrome avec un bilan martial normal.",
    "L’échographie fœtale révèle un œdème fœtal massif, une ascite et des épanchements pleuraux compatibles avec un hydrops fœtal.",
    "L’électrophorèse de l’hémoglobine des deux parents révèle un profil compatible avec le trait thalassémique alpha.",
  ],
};

const STEPS = [
  {
    title: "Le diagnostic",
    text: "Saisissez la réponse attendue, celle qui s’affiche au verso de la carte.",
    icon: "🩺",
  },
  {
    title: "Les 6 indices",
    text: "Un indice par pastille colorée : rose, vert, bleu, orange, violet, turquoise.",
    icon: "✍️",
  },
  {
    title: "Impression & QR",
    text: "Le design rose & or reste verrouillé, le QR code est généré automatiquement.",
    icon: "✨",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const sampleQr = await qrDataUrl(SAMPLE.shareUrl);

  return (
    <div className="sb-app-bg min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white ring-1 ring-blush-200">
            <Crown className="absolute -top-2.5 h-5 w-8" />
            <span className="font-serif text-lg font-black italic text-blush-700">
              SB
            </span>
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-lg font-bold text-plum-900">
              SB Cards
            </span>
            <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-blush-500">
              Studio médical
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/explore" className="sb-btn-ghost hidden sm:inline-flex">
            Découvrir
          </Link>
          {user ? (
            <Link href="/dashboard" className="sb-btn-primary">
              Ouvrir le studio
            </Link>
          ) : (
            <>
              <Link href="/login" className="sb-btn-ghost hidden sm:inline-flex">
                Connexion
              </Link>
              <Link href="/register" className="sb-btn-primary">
                Créer un compte
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-20">
        <section className="grid items-center gap-12 py-10 lg:grid-cols-[1.05fr_1fr] lg:py-14">
          <div className="sb-fade-up">
            <span className="sb-chip">
              ✦ Un modèle unique, rose &amp; or
            </span>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.08] tracking-tight text-plum-900 sm:text-5xl">
              Vos cas cliniques,
              <span className="block bg-[linear-gradient(100deg,#c22f77,#e2569a_55%,#dfa02f)] bg-clip-text text-transparent">
                en cartes inoubliables.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-plum-900/70">
              SB Cards transforme un diagnostic et six indices en une carte
              pédagogique prête à imprimer ou à partager par QR code. Le design
              reste identique — vous ne changez que le contenu médical.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={user ? "/dashboard/cards/new" : "/register"}
                className="sb-btn-primary px-5 py-3 text-[0.95rem]"
              >
                Générer ma première carte
                <span aria-hidden="true">→</span>
              </Link>
              <Link href="/login" className="sb-btn-secondary px-5 py-3">
                Voir la démo
              </Link>
            </div>

            <dl className="mt-9 grid max-w-lg grid-cols-3 gap-3">
              {[
                { label: "Indices par carte", value: "6" },
                { label: "Cartes prêtes", value: "Recto/Verso" },
                { label: "QR intégré", value: "100 %" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-blush-200/70 bg-white/70 px-3 py-3 text-center"
                >
                  <dt className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-plum-900/50">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 font-serif text-lg font-bold text-blush-700">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-7 flex flex-wrap gap-2">
              {CLUE_TONES.map((tone) => (
                <span
                  key={tone.name}
                  className="h-6 w-6 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: tone.circle }}
                  title={tone.name}
                />
              ))}
              <span className="self-center pl-1 text-xs font-medium text-plum-900/50">
                Six pastilles, six indices, un seul design.
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-[radial-gradient(closest-side,rgba(247,214,229,0.9),transparent)] blur-xl" />
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <CardFront {...SAMPLE} className="pt-6" />
              <CardBack {...SAMPLE} qrDataUrl={sampleQr} className="pt-6" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="sb-panel p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blush-100 text-lg">
                  {step.icon}
                </span>
                <span className="font-serif text-2xl font-black text-blush-200">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-4 font-serif text-lg font-bold text-plum-900">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-plum-900/65">
                {step.text}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-12 overflow-hidden rounded-3xl border border-blush-200/70 bg-[linear-gradient(120deg,#5a1739,#7f2152_55%,#a72c69)] p-8 text-white sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-blush-200">
                Prêt en 3 minutes
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold leading-tight">
                Un studio, un modèle, six indices.
              </h2>
              <p className="mt-2 max-w-xl text-sm text-blush-100/85">
                Compte de démonstration pré-rempli avec six cas cliniques
                réalistes de médecine materno-fœtale.
              </p>
            </div>
            <Link
              href={user ? "/dashboard" : "/login"}
              className="sb-btn shrink-0 bg-white px-5 py-3 text-blush-800 hover:bg-blush-50"
            >
              {user ? "Reprendre le studio" : "Essayer le studio"}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-blush-200/70 bg-white/60 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-5 text-xs text-plum-900/55 sm:flex-row">
          <p>© {new Date().getFullYear()} SB Cards — studio pédagogique.</p>
          <p>Design rose &amp; or · 6 indices · QR code intégré.</p>
        </div>
      </footer>
    </div>
  );
}
