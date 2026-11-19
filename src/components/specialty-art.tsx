/**
 * Illustrations « filigrane » selon la spécialité médicale.
 * Placées DERRIÈRE le texte (côté droit), en rose translucide,
 * sans jamais modifier la numérotation ni les couleurs des indices.
 */

const P = "#e88fb8"; // rose moyen
const L = "#f2aecb"; // rose clair
const D = "#cf6f9d"; // rose soutenu

function Pregnant() {
  return (
    <svg viewBox="0 0 200 260" className="h-full w-full" aria-hidden="true">
      {/* tête + cheveux */}
      <circle cx="128" cy="40" r="23" fill={P} />
      <path d="M105 34c0-16 12-26 25-26 15 0 25 11 25 26 0 6-2 10-4 13 1-16-9-24-21-24-13 0-23 9-23 22z" fill={D} />
      <circle cx="150" cy="22" r="9" fill={D} />
      {/* corps profil avec ventre */}
      <path
        d="M118 62c-4 10-8 16-10 26-3 14-24 26-26 48-2 20 10 34 12 48 2 12-2 22-4 34h64c-2-16-4-30-2-44 3-20 6-40 2-62-3-18-10-30-14-40-4-8-8-12-10-16z"
        fill={P}
      />
      {/* bras entourant le ventre */}
      <path d="M116 84c-10 14-22 30-24 48-1 10 4 16 12 18" fill="none" stroke={D} strokeWidth="7" strokeLinecap="round" />
      {/* échographie */}
      <g transform="rotate(-8 70 205)">
        <rect x="34" y="178" width="76" height="56" rx="8" fill={L} stroke={D} strokeWidth="3" />
        <path d="M46 214c8-16 22-24 34-24 10 0 18 6 22 14" fill="none" stroke={D} strokeWidth="3" />
        <circle cx="76" cy="204" r="10" fill={P} />
        <path d="M84 210c6 2 10 6 12 10" fill="none" stroke={D} strokeWidth="3" />
      </g>
    </svg>
  );
}

function Baby() {
  return (
    <svg viewBox="0 0 200 260" className="h-full w-full" aria-hidden="true">
      {/* tête */}
      <circle cx="110" cy="70" r="40" fill={P} />
      <path d="M110 30c4-8 12-10 16-6" fill="none" stroke={D} strokeWidth="5" strokeLinecap="round" />
      {/* yeux fermés + sourire */}
      <path d="M96 68c3 3 7 3 10 0M120 68c3 3 7 3 10 0" fill="none" stroke={D} strokeWidth="4" strokeLinecap="round" />
      <path d="M102 84c5 5 12 5 17 0" fill="none" stroke={D} strokeWidth="4" strokeLinecap="round" />
      {/* corps emmailloté */}
      <path d="M78 108c-14 16-20 40-16 66 3 22 16 38 48 38s45-16 48-38c4-26-2-50-16-66-10 10-22 14-32 14s-22-4-32-14z" fill={L} />
      <path d="M84 140c20 12 44 12 64 0M80 168c24 12 48 12 72 0" fill="none" stroke={P} strokeWidth="5" strokeLinecap="round" />
      {/* hochet / étoile */}
      <path d="M160 150l5 12 13 1-10 9 3 13-11-7-11 7 3-13-10-9 13-1z" fill={D} />
    </svg>
  );
}

function Heart() {
  return (
    <svg viewBox="0 0 200 260" className="h-full w-full" aria-hidden="true">
      <path
        d="M100 210C40 160 20 120 20 88c0-26 20-46 44-46 16 0 28 8 36 22 8-14 20-22 36-22 24 0 44 20 44 46 0 32-20 72-80 122z"
        fill={P}
      />
      <path d="M30 120h34l10-22 14 40 12-30 8 12h62" fill="none" stroke={L} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Blood() {
  return (
    <svg viewBox="0 0 200 260" className="h-full w-full" aria-hidden="true">
      <path d="M100 26c30 44 56 78 56 112 0 34-25 60-56 60s-56-26-56-60c0-34 26-68 56-112z" fill={P} />
      <path d="M76 130c0 18 12 30 26 32" fill="none" stroke={L} strokeWidth="7" strokeLinecap="round" />
      <circle cx="150" cy="200" r="16" fill={L} stroke={D} strokeWidth="4" />
      <circle cx="52" cy="212" r="12" fill={L} stroke={D} strokeWidth="4" />
      <circle cx="150" cy="200" r="6" fill={D} />
    </svg>
  );
}

function Kidney() {
  return (
    <svg viewBox="0 0 200 260" className="h-full w-full" aria-hidden="true">
      <path d="M78 40c-30 0-50 30-50 70s20 70 50 70c18 0 26-12 26-26 0-12-8-18-8-30s8-18 8-30c0-14-8-54-26-54z" fill={P} />
      <path d="M122 40c30 0 50 30 50 70s-20 70-50 70c-18 0-26-12-26-26 0-12 8-18 8-30s-8-18-8-30c0-14 8-54 26-54z" fill={L} />
      <path d="M100 150v60M100 210c-8 8-16 10-24 10M100 210c8 8 16 10 24 10" fill="none" stroke={D} strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function Liver() {
  return (
    <svg viewBox="0 0 200 260" className="h-full w-full" aria-hidden="true">
      <path d="M28 70c40-18 110-18 144 4 6 22-2 44-20 56-30 20-70 26-96 14-22-10-32-40-28-74z" fill={P} />
      <path d="M60 96c30-8 62-8 88 2" fill="none" stroke={L} strokeWidth="6" strokeLinecap="round" />
      <path d="M96 150c-6 20-2 40 10 54 10 12 26 14 36 6" fill="none" stroke={D} strokeWidth="8" strokeLinecap="round" />
      <circle cx="150" cy="196" r="14" fill={L} stroke={D} strokeWidth="4" />
    </svg>
  );
}

function Virus() {
  return (
    <svg viewBox="0 0 200 260" className="h-full w-full" aria-hidden="true">
      <circle cx="100" cy="120" r="52" fill={P} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x1 = 100 + Math.cos(a) * 52;
        const y1 = 120 + Math.sin(a) * 52;
        const x2 = 100 + Math.cos(a) * 70;
        const y2 = 120 + Math.sin(a) * 70;
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={D} strokeWidth="6" strokeLinecap="round" />
            <circle cx={x2} cy={y2} r="7" fill={D} />
          </g>
        );
      })}
      <circle cx="84" cy="106" r="10" fill={L} />
      <circle cx="116" cy="132" r="8" fill={L} />
      <circle cx="104" cy="100" r="6" fill={L} />
    </svg>
  );
}

function Thyroid() {
  return (
    <svg viewBox="0 0 200 260" className="h-full w-full" aria-hidden="true">
      <path d="M100 60c-14-16-40-20-54-6-14 14-12 40 4 54 16 14 36 12 50 0z" fill={P} />
      <path d="M100 60c14-16 40-20 54-6 14 14 12 40-4 54-16 14-36 12-50 0z" fill={L} />
      <path d="M100 52v96M88 148h24M88 164h24M88 180h24" fill="none" stroke={D} strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function DefaultArt() {
  return (
    <svg viewBox="0 0 200 260" className="h-full w-full" aria-hidden="true">
      <path d="M60 30v40a34 34 0 0 0 68 0V30" fill="none" stroke={P} strokeWidth="10" strokeLinecap="round" />
      <path d="M94 104v22a30 30 0 0 0 30 30h8" fill="none" stroke={P} strokeWidth="10" strokeLinecap="round" />
      <circle cx="146" cy="156" r="20" fill={L} stroke={D} strokeWidth="7" />
      <path d="M60 190h40M80 170v40" stroke={D} strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}

export function specialtyArtKey(specialty?: string): string {
  const s = (specialty ?? "").toLowerCase();
  if (s.includes("materno") || s.includes("obst") || s.includes("gyn")) return "pregnant";
  if (s.includes("pédi") || s.includes("pedi") || s.includes("enfant") || s.includes("bébé")) return "baby";
  if (s.includes("cardio")) return "heart";
  if (s.includes("hém") || s.includes("hem")) return "blood";
  if (s.includes("néph") || s.includes("neph")) return "kidney";
  if (s.includes("hép") || s.includes("hep") || s.includes("gastro")) return "liver";
  if (s.includes("infect")) return "virus";
  if (s.includes("endocr")) return "thyroid";
  return "default";
}

export function SpecialtyArt({
  specialty,
  className = "",
}: {
  specialty?: string;
  className?: string;
}) {
  const key = specialtyArtKey(specialty);
  return (
    <div className={`pointer-events-none ${className}`} aria-hidden="true">
      {key === "pregnant" && <Pregnant />}
      {key === "baby" && <Baby />}
      {key === "heart" && <Heart />}
      {key === "blood" && <Blood />}
      {key === "kidney" && <Kidney />}
      {key === "liver" && <Liver />}
      {key === "virus" && <Virus />}
      {key === "thyroid" && <Thyroid />}
      {key === "default" && <DefaultArt />}
    </div>
  );
}
