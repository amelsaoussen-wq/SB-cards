import type { ReactNode } from "react";
import { CLUE_TONES, TONE_COUNT } from "@/lib/constants";
import { SpecialtyArt } from "@/components/specialty-art";
import {
  CrescentSwoosh,
  Crown,
  FacebookGlyph,
  LeafSpray,
  Ornament,
  Sparkle,
  Stethoscope,
} from "@/components/ornaments";

export type ArtworkProps = {
  diagnosis: string;
  questionLabel: string;
  clues: string[];
  logoInitials: string;
  footerLabel: string;
  socialUrl: string;
  shareUrl: string;
  qrDataUrl?: string;
  specialty?: string;
  className?: string;
};

function CardShell({
  children,
  watermark,
  specialty,
  className = "",
}: {
  children: ReactNode;
  watermark: string;
  specialty?: string;
  className?: string;
}) {
  return (
    <div className={`@container w-full ${className}`}>
      <div className="rounded-[4.6cqw] bg-[linear-gradient(135deg,#f9d98a_0%,#e7a432_28%,#fbe3ab_52%,#e19a24_78%,#f8d98d_100%)] p-[1.4cqw] shadow-[0_24px_50px_-28px_rgba(128,24,80,0.55)]">
        <div className="relative overflow-hidden rounded-[3.4cqw] border-[0.35cqw] border-[#fff4d9]/80 bg-[radial-gradient(125%_80%_at_50%_-8%,#fffdfe_0%,#ffeef6_32%,#fcd9ea_66%,#f7c2dd_100%)]">
          <div className="pointer-events-none absolute inset-[1.4cqw] rounded-[2.6cqw] border-[0.22cqw] border-[#f0aecb]/60" />

          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[26%] -translate-x-1/2 select-none font-serif text-[58cqw] font-black leading-none tracking-[-0.06em] text-[#e46fa7] opacity-[0.09]"
          >
            {watermark}
          </span>

          <LeafSpray className="pointer-events-none absolute -left-[1cqw] bottom-[1cqw] h-[27cqw] w-[15cqw] opacity-95" />
          <LeafSpray
            flip
            className="pointer-events-none absolute -right-[1cqw] bottom-[1cqw] h-[27cqw] w-[15cqw] opacity-95"
          />
          <Sparkle className="pointer-events-none absolute left-[30%] top-[15cqw] w-[2.6cqw] opacity-90" />
          <Sparkle className="pointer-events-none absolute right-[26%] top-[22cqw] w-[2cqw] opacity-80" />

          {/* Illustration de la spécialité, DERRIÈRE le texte (côté droit). */}
          <SpecialtyArt
            specialty={specialty}
            className="absolute -right-[4cqw] top-[26cqw] h-[102cqw] w-[58cqw] opacity-[0.9]"
          />

          <div className="relative flex min-h-[139cqw] flex-col px-[3.6cqw] pb-[2.4cqw] pt-[2.6cqw]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardHeader({
  logoInitials,
  compact = false,
}: {
  logoInitials: string;
  compact?: boolean;
}) {
  return (
    <div className="relative flex items-start justify-center">
      <LeafSpray className="absolute -left-[1.6cqw] -top-[1.6cqw] h-[24cqw] w-[14cqw]" />
      <LeafSpray
        flip
        className="absolute -right-[1.6cqw] -top-[1.6cqw] h-[24cqw] w-[14cqw]"
      />

      <div className="relative flex flex-col items-center">
        <Crown className="relative z-20 h-[9.4cqw] w-[17cqw] drop-shadow-[0_0.2cqw_0.2cqw_rgba(150,90,10,0.25)]" />
        <div className={`relative ${compact ? "mt-[-1.2cqw]" : "mt-[-1.8cqw]"}`}>
          <CrescentSwoosh className="absolute left-1/2 top-[58%] w-[27cqw] -translate-x-1/2" />
          <span
            className="relative z-10 block bg-[linear-gradient(180deg,#ff8fc0_0%,#ef3f8e_45%,#c31f6c_100%)] bg-clip-text font-serif text-[15cqw] font-black italic leading-[0.9] tracking-[-0.05em] text-transparent drop-shadow-[0_0.25cqw_0.15cqw_rgba(150,20,80,0.35)]"
            style={{ WebkitTextStroke: "0.38cqw #fffdf7" }}
          >
            {logoInitials || "SB"}
          </span>
        </div>
      </div>

      <Stethoscope className="absolute right-[-0.4cqw] top-[1.2cqw] w-[13.5cqw]" />
      <Sparkle className="absolute left-[17%] top-[8cqw] w-[3.4cqw]" />
      <Sparkle className="absolute left-[23%] top-[15cqw] w-[2.2cqw]" />
      <Sparkle className="absolute right-[23%] top-[16cqw] w-[2.6cqw]" />
    </div>
  );
}

export function CardFront(props: ArtworkProps) {
  const {
    diagnosis,
    questionLabel,
    clues,
    logoInitials,
    specialty,
    className = "",
  } = props;

  const rows = Array.from({ length: TONE_COUNT }, (_, index) => ({
    tone: CLUE_TONES[index],
    text: clues[index]?.trim() ?? "",
  }));

  return (
    <article aria-label="Carte question — six indices" className={className}>
      <CardShell watermark={logoInitials || "SB"} specialty={specialty}>
        <CardHeader logoInitials={logoInitials} compact />

        <div className="relative mx-auto mt-[2cqw] w-full rounded-full border-[0.5cqw] border-[#e2a63f] bg-[linear-gradient(180deg,#fffaf0,#ffe5bf)] px-[3cqw] py-[1.3cqw] text-center shadow-[inset_0_0_1.4cqw_rgba(243,197,108,0.6),0_0.4cqw_0.8cqw_rgba(190,120,30,0.18)]">
          <p className="font-serif text-[4.5cqw] font-extrabold leading-[1.1] tracking-[-0.01em] text-[#581334]">
            {questionLabel}
          </p>
        </div>

        <div className="mt-[2.2cqw] flex flex-col gap-[1.35cqw]">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center">
              <div
                className="z-10 flex h-[8.2cqw] w-[8.2cqw] shrink-0 items-center justify-center rounded-full font-serif text-[4.6cqw] font-black text-white shadow-[0_0.3cqw_0.6cqw_rgba(90,20,60,0.28)] ring-[0.35cqw] ring-white/70"
                style={{
                  background: `radial-gradient(circle at 32% 24%, rgba(255,255,255,0.75), transparent 58%), linear-gradient(180deg, ${row.tone.circle}, ${row.tone.circle})`,
                }}
              >
                {index + 1}
              </div>
              <div
                className="-ml-[1.3cqw] flex-1 rounded-[2.4cqw] border-[0.42cqw] py-[1.05cqw] pl-[2.6cqw] pr-[1.8cqw] text-center"
                style={{
                  // Translucidité : l'illustration de spécialité transparaît
                  // DERRIÈRE le texte, sans changer la teinte ni le numéro.
                  background: `${row.tone.card}8C`,
                  borderColor: row.tone.border,
                }}
              >
                <p className="font-serif text-[2.78cqw] font-semibold leading-[1.26] text-[#48112e]">
                  {row.text || "Indice à compléter…"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto flex flex-col items-center pt-[1.8cqw]">
          <Ornament className="h-[4.4cqw] w-[72%] opacity-90" />
        </div>
      </CardShell>
    </article>
  );
}

export function CardBack(props: ArtworkProps) {
  const {
    diagnosis,
    logoInitials,
    footerLabel,
    socialUrl,
    shareUrl,
    qrDataUrl,
    specialty,
    className = "",
  } = props;

  return (
    <article aria-label={`Carte réponse — ${diagnosis}`} className={className}>
      <CardShell watermark={logoInitials || "SB"} specialty={specialty}>
        <CardHeader logoInitials={logoInitials} />

        <div className="relative mx-auto mt-[7cqw] w-full rounded-[3.4cqw] border-[0.55cqw] border-[#e2a63f] bg-[linear-gradient(180deg,#fffaf0,#ffe8c8)] px-[2.6cqw] py-[2.4cqw] text-center shadow-[inset_0_0_1.6cqw_rgba(243,197,108,0.55),0_0.5cqw_1cqw_rgba(190,120,30,0.2)]">
          <Sparkle className="absolute -left-[1.8cqw] top-1/2 w-[3.4cqw] -translate-y-1/2" />
          <Sparkle className="absolute -right-[1.8cqw] top-1/2 w-[3.4cqw] -translate-y-1/2" />
          <p className="font-serif text-[5.6cqw] font-extrabold leading-[1.12] tracking-[-0.015em] text-[#571132]">
            {diagnosis || "Votre diagnostic"}
          </p>
        </div>

        <div className="mx-auto mt-[5cqw] flex aspect-square w-[62%] items-center justify-center rounded-[3cqw] border-[0.7cqw] border-[#ecb44c] bg-white p-[1.8cqw] shadow-[0_1cqw_2.4cqw_rgba(150,80,30,0.22)]">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={`QR code vers la carte : ${shareUrl}`}
              width={640}
              height={640}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-center font-serif text-[3cqw] font-bold leading-tight text-[#a72c69]">
              QR code
              <span className="mt-[1cqw] block text-[2.2cqw] font-normal text-[#a72c69]/60">
                disponible après publication
              </span>
            </span>
          )}
        </div>

        <a
          href={socialUrl || "#"}
          className="mx-auto mt-auto flex w-full items-center justify-center gap-[2cqw] rounded-full border-[0.5cqw] border-[#ecb44c] bg-[linear-gradient(180deg,#fffdf8,#ffeedc)] px-[2.4cqw] py-[1.6cqw]"
        >
          <FacebookGlyph className="h-[7cqw] w-[7cqw] shrink-0 drop-shadow" />
          <span className="text-left font-serif text-[2.7cqw] font-semibold italic leading-[1.2] text-[#4d1130]">
            {footerLabel || "Suivez notre page sur Facebook"}
          </span>
          <svg viewBox="0 0 40 40" className="h-[5.4cqw] w-[5.4cqw] shrink-0" aria-hidden="true">
            <path
              d="M20 7c-5-6-15-1-15 6 0 8 11 12 15 19 4-7 15-11 15-19 0-7-10-12-15-6z"
              fill="none"
              stroke="#e2519a"
              strokeWidth="2.6"
            />
          </svg>
        </a>

        <div className="flex flex-col items-center pt-[1.6cqw]">
          <Ornament className="h-[4.2cqw] w-[70%] opacity-90" />
        </div>
      </CardShell>
    </article>
  );
}
