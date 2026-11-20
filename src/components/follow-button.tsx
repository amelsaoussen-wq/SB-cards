"use client";

import Link from "next/link";
import { useState } from "react";

export function FollowButton({
  channelId,
  initialFollowing,
  loggedIn,
  compact = false,
}: {
  channelId: string;
  initialFollowing: boolean;
  loggedIn: boolean;
  compact?: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  if (!loggedIn) {
    return (
      <Link
        href="/login"
        className={`sb-btn-secondary ${compact ? "!px-3 !py-1.5 text-xs" : ""}`}
      >
        Se connecter pour suivre
      </Link>
    );
  }

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !following;
    setFollowing(next); // optimiste
    try {
      const res = await fetch(`/api/channels/${channelId}/follow`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) setFollowing(!next);
    } catch {
      setFollowing(!next);
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={
        following
          ? `sb-btn-secondary ${compact ? "!px-3 !py-1.5 text-xs" : ""}`
          : `sb-btn-primary ${compact ? "!px-3 !py-1.5 text-xs" : ""}`
      }
    >
      {following ? "Suivi ✓" : "+ Suivre"}
    </button>
  );
}
