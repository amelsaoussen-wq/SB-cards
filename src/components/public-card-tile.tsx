import Link from "next/link";
import type { CommunityCard } from "@/lib/community";
import type { Engagement } from "@/lib/engagement";
import { CardFront } from "@/components/card-artwork";
import { PostBody } from "@/components/post-body";
import { Avatar } from "@/components/avatar";
import { ExplainAnswer } from "@/components/explain-answer";
import { optionsFromPool } from "@/lib/quiz";
import { formatDateTime } from "@/lib/format";

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
  pool,
  platform,
  starUserId,
}: {
  card: CommunityCard;
  engagement: Engagement;
  loggedIn: boolean;
  pool: string[];
  platform: { correct: number; wrong: number };
  starUserId?: string;
}) {
  const options = optionsFromPool(pool, card.diagnosis);

  const front = (
    <CardFront
      diagnosis={card.diagnosis}
      questionLabel={card.questionLabel}
      clues={card.clues.map((c) => c.body)}
      logoInitials={card.logoInitials}
      footerLabel={card.footerLabel}
      socialUrl={card.socialUrl}
      shareUrl={card.shareCode}
      specialty={card.specialty}
      className="w-full"
    />
  );

  const reveal = (
    <ExplainAnswer diagnosis={card.diagnosis} explanation={card.explanation} />
  );

  return (
    <div className="sb-panel flex flex-col gap-2.5 p-3 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="min-w-0">
        <Link
          href={`/ch/${card.channel.id}`}
          className="flex items-center gap-2 text-sm font-semibold text-blush-700 hover:underline"
        >
          <Avatar name={card.channel.name} avatar={card.channel.avatar} className="h-9 w-9 text-[0.6rem]" />
          <span className="truncate">{card.channel.name}</span>
          {starUserId === card.channel.id && (
            <span className="shrink-0 text-[0.7rem]" title="Star du jour">⭐</span>
          )}
          {card.channel.isAdmin && (
            <span className="shrink-0 rounded-full bg-gold-300/40 px-1.5 py-0.5 text-[0.55rem] font-bold text-gold-500">
              👑 Officiel
            </span>
          )}
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
        <p className="mt-1 text-[0.65rem] text-plum-900/45">
          🕒 Publié le {formatDateTime(card.publishedAt ?? card.updatedAt)}
        </p>
      </div>

      <PostBody
        cardId={card.id}
        options={options}
        initialPlatform={platform}
        initialLikes={engagement.likes}
        initialLiked={engagement.liked}
        initialComments={engagement.comments}
        loggedIn={loggedIn}
        printHref={`/c/${card.shareCode}/print`}
        explanation={card.explanation}
        front={front}
        reveal={reveal}
      />
    </div>
  );
}
