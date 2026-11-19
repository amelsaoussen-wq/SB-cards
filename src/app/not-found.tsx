import Link from "next/link";
import { Crown } from "@/components/ornaments";

export default function NotFound() {
  return (
    <div className="sb-app-bg flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-white ring-1 ring-blush-200">
        <Crown className="absolute -top-3.5 h-7 w-11" />
        <span className="font-serif text-2xl font-black italic text-blush-700">
          SB
        </span>
      </span>
      <h1 className="mt-6 font-serif text-3xl font-bold text-plum-900">
        Cette carte s’est égarée
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-plum-900/60">
        Le lien est peut-être expiré, la carte repassée en brouillon, ou le QR
        code mal recopié.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/dashboard" className="sb-btn-primary">
          Retour au studio
        </Link>
        <Link href="/" className="sb-btn-secondary">
          Page d’accueil
        </Link>
      </div>
    </div>
  );
}
