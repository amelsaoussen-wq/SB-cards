import Link from "next/link";
import type { ReactNode } from "react";
import { CardFront } from "@/components/card-artwork";
import { Crown } from "@/components/ornaments";

const PREVIEW = {
  specialty: "Médecine materno-fœtale",
  diagnosis: "Syndrome de Bart de l’hémoglobine / Alpha-thalassémie majeure",
  questionLabel: "Quel est le diagnostic ?",
  logoInitials: "SB",
  footerLabel: "Suivez notre page sur Facebook",
  socialUrl: "https://www.facebook.com/sb.medical.cards",
  shareUrl: "https://sb-cards.app/c/demo",
  clues: [
    "Une femme de 28 ans, enceinte de 24 semaines, est orientée après une échographie de routine anormale.",
    "Une anémie diagnostiquée dans l’enfance, sans suivi depuis.",
    "Elle et son compagnon sont tous deux originaires du Vietnam.",
    "Anémie microcytaire hypochrome avec un bilan martial normal.",
    "Œdème fœtal massif, ascite et épanchements pleuraux : hydrops fœtal.",
    "Électrophorèse des parents compatible avec un trait thalassémique alpha.",
  ],
};

export function AuthScreen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-blush-50 lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-10">
        <Link href="/" className="flex items-center gap-3 self-start">
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

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <div className="sb-panel p-6 sm:p-8">
            <h1 className="font-serif text-3xl font-bold leading-tight text-plum-900">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-plum-900/60">
              {subtitle}
            </p>
            <div className="mt-6">{children}</div>
          </div>

          <p className="mt-6 rounded-2xl border border-gold-300/50 bg-[linear-gradient(140deg,#fffaf0,#fdf0f6)] px-4 py-3 text-xs leading-relaxed text-plum-900/70">
            <span className="font-bold text-gold-500">✦ Compte démo</span> —{" "}
            <span className="font-mono">demo@sb-cards.app</span> /{" "}
            <span className="font-mono">demo1234</span>. Six cas cliniques et le
            design rose &amp; or sont déjà en place.
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-[linear-gradient(150deg,#5a1739,#7f2152_45%,#a72c69)] lg:flex lg:items-center lg:justify-center">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-blush-400/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="relative w-[330px] rotate-[-3deg]">
          <CardFront {...PREVIEW} className="drop-shadow-2xl" />
        </div>
        <div className="absolute bottom-10 left-10 right-10 rounded-2xl border border-white/15 bg-white/10 p-5 text-white backdrop-blur">
          <p className="font-serif text-lg font-semibold">
            « Un diagnostic, six indices, un design constant. »
          </p>
          <p className="mt-1 text-xs text-blush-100/80">
            Générateur de cartes pédagogiques — médecine materno-fœtale &amp;
            spécialités.
          </p>
        </div>
      </div>
    </div>
  );
}
