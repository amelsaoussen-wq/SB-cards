import Link from "next/link";
import type { DayStar } from "@/lib/leaderboard";
import { Avatar } from "@/components/avatar";

/**
 * « نجم اليوم » ⭐ : publié le lendemain de la journée évaluée.
 * Affiche le compte le plus performant (bonnes réponses) de la veille.
 */
export function StarBanner({ star }: { star: DayStar | null }) {
  if (!star) return null;
  return (
    <div className="sb-fade-up flex items-center gap-3 rounded-2xl border border-gold-300/70 bg-[linear-gradient(120deg,#fffaf0,#fdf0f6_60%,#fbe4ef)] p-3 shadow-soft">
      <span className="text-2xl" aria-hidden="true">⭐</span>
      <Avatar name={star.name} avatar={star.avatar} className="h-10 w-10 text-xs" />
      <div className="min-w-0 flex-1">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-gold-500">
          نجم اليوم · Star du jour ({star.day})
        </p>
        <Link
          href={`/ch/${star.userId}`}
          className="block truncate font-serif text-sm font-bold text-plum-900 hover:underline"
        >
          {star.name}
        </Link>
        <p className="text-[0.65rem] text-plum-900/50">
          {star.count} bonne{star.count > 1 ? "s" : ""} réponse
          {star.count > 1 ? "s" : ""} · publié le lendemain
        </p>
      </div>
      <Link href={`/ch/${star.userId}`} className="sb-btn-secondary shrink-0 !px-3 !py-1.5 text-xs">
        Voir la chaîne
      </Link>
    </div>
  );
}
