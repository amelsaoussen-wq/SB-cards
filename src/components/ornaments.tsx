import type { CSSProperties } from "react";

export function Crown({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 200 110" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id="crownGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="45%" stopColor="#f2c14e" />
          <stop offset="100%" stopColor="#d99a2b" />
        </linearGradient>
      </defs>
      <g fill="url(#crownGold)" stroke="#c5861f" strokeWidth="3" strokeLinejoin="round">
        <path d="M18 88 L10 30 L58 58 L100 14 L142 58 L190 30 L182 88 Z" />
        <rect x="18" y="90" width="164" height="16" rx="8" />
      </g>
      <g fill="#d63384">
        <circle cx="10" cy="26" r="8" />
        <circle cx="100" cy="12" r="9" />
        <circle cx="190" cy="26" r="8" />
        <circle cx="58" cy="56" r="6" />
        <circle cx="142" cy="56" r="6" />
      </g>
      <g fill="#fff6d8">
        <circle cx="100" cy="66" r="7" />
        <circle cx="62" cy="74" r="6" />
        <circle cx="138" cy="74" r="6" />
      </g>
      <g fill="#e94f9a">
        <circle cx="100" cy="66" r="3.4" />
        <circle cx="62" cy="74" r="2.8" />
        <circle cx="138" cy="74" r="2.8" />
      </g>
    </svg>
  );
}

export function Stethoscope({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 150" className={className} aria-hidden="true">
      <g fill="none" stroke="#f06aa8" strokeWidth="8" strokeLinecap="round">
        <path d="M26 12 v34 a26 26 0 0 0 52 0 V12" />
        <path d="M52 72 v18 a30 30 0 0 0 30 30 h6" />
        <path d="M18 12 h16 M70 12 h16" strokeWidth="10" />
      </g>
      <circle cx="108" cy="120" r="22" fill="#fbd4e6" stroke="#e2519a" strokeWidth="8" />
      <circle cx="108" cy="120" r="8" fill="#f06aa8" />
      <path
        d="M104 60 h10 l6 -12 l7 24 l6 -12 h13"
        fill="none"
        stroke="#f38dbb"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M132 42c-6-8-18-3-18 6 0 9 12 14 18 20 6-6 18-11 18-20 0-9-12-14-18-6z"
        fill="#fbd0e3"
        stroke="#ec5f9f"
        strokeWidth="4"
      />
    </svg>
  );
}

export function LeafSpray({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 150 260"
      className={className}
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="leafGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8d68a" />
          <stop offset="60%" stopColor="#eaa93c" />
          <stop offset="100%" stopColor="#cf8120" />
        </linearGradient>
        <linearGradient id="leafPink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd0e5" />
          <stop offset="60%" stopColor="#f287b7" />
          <stop offset="100%" stopColor="#db4f8f" />
        </linearGradient>
      </defs>
      <path
        d="M14 254 C 40 190 70 140 118 88"
        fill="none"
        stroke="url(#leafGold)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {[
        { x: 16, y: 228, r: -42, f: false },
        { x: 34, y: 196, r: -12, f: true },
        { x: 46, y: 170, r: -56, f: false },
        { x: 66, y: 140, r: -20, f: true },
        { x: 78, y: 116, r: -62, f: false },
        { x: 98, y: 92, r: -24, f: true },
        { x: 112, y: 74, r: -66, f: false },
      ].map((leaf, index) => (
        <ellipse
          key={index}
          cx={leaf.x}
          cy={leaf.y}
          rx="27"
          ry="12"
          fill={leaf.f ? "url(#leafPink)" : "url(#leafGold)"}
          opacity="0.92"
          transform={`rotate(${leaf.r} ${leaf.x} ${leaf.y})`}
        />
      ))}
    </svg>
  );
}

export function Sparkle({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 40 40" className={className} style={style} aria-hidden="true">
      <path
        d="M20 0 C22 12 28 18 40 20 C28 22 22 28 20 40 C18 28 12 22 0 20 C12 18 18 12 20 0Z"
        fill="#f6c344"
        stroke="#e0a41f"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function CrescentSwoosh({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 90" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="swooshGold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f9d47e" />
          <stop offset="50%" stopColor="#eaa93c" />
          <stop offset="100%" stopColor="#f9d47e" />
        </linearGradient>
      </defs>
      <path
        d="M6 48 C 48 88 172 88 214 48 C 180 70 40 70 6 48 Z"
        fill="url(#swooshGold)"
        stroke="#cf8420"
        strokeWidth="2"
      />
    </svg>
  );
}

export function Ornament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 40" className={className} aria-hidden="true">
      <g fill="none" stroke="#e6a93c" strokeWidth="2.6" strokeLinecap="round">
        <path d="M8 30 C 54 30 66 12 104 12" />
        <path d="M312 30 C 266 30 254 12 216 12" />
        <path d="M104 12 C 128 12 136 26 152 26" />
        <path d="M216 12 C 192 12 184 26 168 26" />
      </g>
      <path
        d="M160 6c-6-8-18-2-18 6 0 8 12 13 18 20 6-7 18-12 18-20 0-8-12-14-18-6z"
        fill="#f7c6dd"
        stroke="#dd4f92"
        strokeWidth="2.4"
      />
    </svg>
  );
}

export function FacebookGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#1877f2" />
      <path
        d="M21.6 20.6l.7-4.4h-4.2v-2.9c0-1.2.6-2.4 2.5-2.4h1.9V7.2s-1.7-.3-3.4-.3c-3.4 0-5.7 2.1-5.7 5.9v3.4h-3.8v4.4h3.8V28a15 15 0 0 0 4.6 0v-7.4h3.6z"
        fill="#fff"
      />
    </svg>
  );
}

/**
 * Branche de feuilles (rose + or) épousant les côtés de la carte,
 * comme le design de référence (remplace les anciennes « colonnes »).
 */
export function LeafBranch({
  className,
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 140 240"
      className={className}
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lbPink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff9ec6" />
          <stop offset="55%" stopColor="#ef5f9e" />
          <stop offset="100%" stopColor="#d84f8f" />
        </linearGradient>
        <linearGradient id="lbGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8d68a" />
          <stop offset="60%" stopColor="#eaa93c" />
          <stop offset="100%" stopColor="#cf8120" />
        </linearGradient>
      </defs>
      {/* tige */}
      <path
        d="M28 236 C 40 180, 44 130, 62 74 C 70 50, 80 30, 92 14"
        fill="none"
        stroke="url(#lbGold)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* feuilles lancées alternées rose / or */}
      {[
        { x: 30, y: 214, r: -100, f: "url(#lbPink)", s: 1.15 },
        { x: 40, y: 186, r: -150, f: "url(#lbGold)", s: 1.0 },
        { x: 42, y: 158, r: -95, f: "url(#lbPink)", s: 1.1 },
        { x: 50, y: 130, r: -145, f: "url(#lbGold)", s: 0.95 },
        { x: 56, y: 104, r: -90, f: "url(#lbPink)", s: 1.05 },
        { x: 66, y: 78, r: -140, f: "url(#lbGold)", s: 0.9 },
        { x: 76, y: 52, r: -85, f: "url(#lbPink)", s: 1.0 },
        { x: 88, y: 28, r: -130, f: "url(#lbGold)", s: 0.85 },
      ].map((l, i) => (
        <path
          key={i}
          d="M0 0 C 12 -16, 34 -16, 46 0 C 34 16, 12 16, 0 0 Z"
          fill={l.f}
          opacity="0.95"
          transform={`translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.s})`}
        />
      ))}
    </svg>
  );
}
