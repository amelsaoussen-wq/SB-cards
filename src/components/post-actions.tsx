"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

type Comment = {
  id: string;
  body: string;
  author: string;
  createdAt: string;
  mine: boolean;
};

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 transition-transform ${filled ? "scale-110" : ""}`}
      fill={filled ? "#e0245e" : "none"}
      stroke={filled ? "#e0245e" : "currentColor"}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21C5.5 16 3 12.3 3 8.8 3 6 5.2 4 7.8 4c1.7 0 3.2.9 4.2 2.4C13 4.9 14.5 4 16.2 4 18.8 4 21 6 21 8.8c0 3.5-2.5 7.2-9 12.2z" />
    </svg>
  );
}

export function PostActions({
  cardId,
  initialLikes,
  initialLiked,
  initialComments,
  loggedIn,
  printHref,
  modeToggle,
}: {
  cardId: string;
  initialLikes: number;
  initialLiked: boolean;
  initialComments: number;
  loggedIn: boolean;
  printHref?: string;
  modeToggle?: ReactNode;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [count, setCount] = useState(initialComments);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function toggleLike() {
    if (!loggedIn) return;
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const res = await fetch(`/api/cards/${cardId}/like`, {
        method: next ? "POST" : "DELETE",
      });
      const data = await res.json();
      if (res.ok && typeof data.likes === "number") setLikes(data.likes);
      else if (!res.ok) {
        setLiked(!next);
        setLikes((n) => n + (next ? -1 : 1));
      }
    } catch {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    }
  }

  async function toggleComments() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      setLoading(true);
      try {
        const res = await fetch(`/api/cards/${cardId}/comments`);
        const data = await res.json();
        if (res.ok) {
          setComments(data.comments ?? []);
          setCount((data.comments ?? []).length);
        }
      } catch {
        /* ignore */
      }
      setLoaded(true);
      setLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/cards/${cardId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setComments((c) => [...c, data.comment]);
        setCount((n) => n + 1);
        setDraft("");
      }
    } catch {
      /* ignore */
    }
    setSending(false);
  }

  async function remove(id: string) {
    setComments((c) => c.filter((x) => x.id !== id));
    setCount((n) => Math.max(0, n - 1));
    await fetch(`/api/comments/${id}`, { method: "DELETE" }).catch(() => undefined);
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 border-t border-blush-100 pt-2">
        {loggedIn ? (
          <button
            type="button"
            onClick={toggleLike}
            aria-pressed={liked}
            aria-label="J’aime"
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${
              liked ? "bg-rose-50 text-rose-600" : "text-plum-900/55 hover:bg-blush-50"
            }`}
          >
            <Heart filled={liked} />
            {likes}
          </button>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-plum-900/55 hover:bg-blush-50"
          >
            <Heart filled={false} />
            {likes}
          </Link>
        )}

        <button
          type="button"
          onClick={toggleComments}
          aria-expanded={open}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${
            open ? "bg-blush-100 text-blush-700" : "text-plum-900/55 hover:bg-blush-50"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z" />
          </svg>
          {count}
        </button>

        {modeToggle}

        {printHref && (
          <a
            href={printHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Télécharger en PDF"
            title="Télécharger en PDF"
            className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-plum-900/55 transition hover:bg-blush-50 hover:text-blush-700"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            PDF
          </a>
        )}
      </div>

      {open && (
        <div className="mt-2 space-y-2 rounded-xl bg-blush-50/60 p-2.5">
          {loading && <p className="text-xs text-plum-900/45">Chargement…</p>}
          {!loading && comments.length === 0 && (
            <p className="text-xs text-plum-900/45">
              Aucun commentaire. Soyez le premier à réagir !
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-white px-2.5 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.68rem] font-bold text-blush-700">{c.author}</span>
                {c.mine && (
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    className="text-[0.62rem] text-plum-900/35 hover:text-rose-600"
                  >
                    supprimer
                  </button>
                )}
              </div>
              <p className="text-xs leading-relaxed text-plum-900/75">{c.body}</p>
            </div>
          ))}

          {loggedIn ? (
            <form onSubmit={submit} className="flex gap-1.5">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={600}
                placeholder="Votre commentaire…"
                className="sb-input !py-1.5 text-xs"
                aria-label="Commentaire"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="sb-btn-primary !px-3 !py-1.5 text-xs"
              >
                {sending ? "…" : "Envoyer"}
              </button>
            </form>
          ) : (
            <Link href="/login" className="block text-center text-xs font-semibold text-blush-700 hover:underline">
              Connectez-vous pour commenter
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
