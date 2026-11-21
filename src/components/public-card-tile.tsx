import Link from "next/link";
import type { CommunityCard } from "@/lib/community";
import type { Engagement } from "@/lib/engagement";
import { CardFront } from "@/components/card-artwork";
import { PostActions } from "@/components/post-actions";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function PublicCardTile({
  card,
  engagement,
  loggedIn,
}: {
  card: CommunityCard;
  engagement: Engagement;
  loggedIn: boolean;
}) {
  return (
    <div className="sb-panel flex flex-col gap-2.5 p-3 transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        href={`/c/${card.shareCode}`}
        className="mx-auto block w-full max-w-[200px]"
        aria-label="Ouvrir le cas clinique"
      >
        <CardFront
          diagnosis={card.diagnosis}
          questionLabel={card.questionLabel}
          clues={card.clues.map((c) => c.body)}
          logoInitials={card.logoInitials}
          footerLabel={card.footerLabel}
          socialUrl={card.socialUrl}
          shareUrl={card.shareCode}
          specialty={card.specialty}
        />
      </Link>

      <div className="min-w-0">
        <Link
          href={`/ch/${card.channel.id}`}
          className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-blush-700 hover:underline"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(140deg,#e2569a,#a72c69)] text-[0.55rem] font-bold text-white">
            {initials(card.channel.name)}
          </span>
          <span className="truncate">{card.channel.name}</span>
        </Link>
        <Link href={`/c/${card.shareCode}`}>
          <h3 className="mt-1 flex items-center gap-1.5 font-serif text-sm font-bold leading-snug text-plum-900 hover:text-blush-700">
            <span aria-hidden="true">🔒</span> Cas clinique à résoudre
          </h3>
        </Link>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="sb-chip truncate">{card.specialty}</span>
          <span className="shrink-0 text-[0.65rem] text-plum-900/40">
            {card.views} scans
          </span>
        </div>
        <div className="mt-2">
          <PostActions
            cardId={card.id}
            initialLikes={engagement.likes}
            initialLiked={engagement.liked}
            initialComments={engagement.comments}
            loggedIn={loggedIn}
          />
        </div>
      </div>
    </div>
  );
}
