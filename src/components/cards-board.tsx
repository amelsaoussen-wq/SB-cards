"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";

import type { CardSummary } from "@/lib/cards";
import type { CardStatus } from "@/lib/constants";
import { CardFront } from "@/components/card-artwork";
import { ClueDots, EmptyState, StatusBadge } from "@/components/ui";
import { formatRelative } from "@/lib/format";

type OptimisticAction =
  | { type: "delete"; id: string }
  | { type: "status"; id: string; status: CardStatus };


async function apiRequest(
  url: string,
  options: RequestInit,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    });
    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      id?: string;
      error?: string;
    };
    if (!response.ok) {
      return {
        ok: false,
        error:
          data.error ??
          (response.status === 401
            ? "Votre session a expiré. Reconnectez-vous."
            : "Action impossible. Réessayez."),
      };
    }
    return { ok: data.ok !== false, id: data.id };
  } catch {
    return { ok: false, error: "Connexion au serveur impossible." };
  }
}

function reduce(cards: CardSummary[], action: OptimisticAction): CardSummary[] {
  if (action.type === "delete") {
    return cards.filter((card) => card.id !== action.id);
  }
  return cards.map((card) =>
    card.id === action.id ? { ...card, status: action.status } : card,
  );
}

export function CardsBoard({
  cards,
  query,
  status,
  specialty,
  specialties,
  totalCount,
}: {
  cards: CardSummary[];
  query: string;
  status: string;
  specialty: string;
  specialties: string[];
  totalCount: number;
}) {
  const router = useRouter();
  const [items, applyOptimistic] = useOptimistic(cards, reduce);
  const [, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );
  const [search, setSearch] = useState(query);
  const firstRender = useRef(true);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (status) params.set("status", status);
      if (specialty) params.set("specialty", specialty);
      const qs = params.toString();
      router.replace(qs ? `/dashboard/cards?${qs}` : "/dashboard/cards");
    }, 350);
    return () => clearTimeout(timer);
  }, [search, status, specialty, router]);

  function pushFilters(next: { status?: string; specialty?: string }) {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    const nextStatus = next.status ?? status;
    const nextSpecialty = next.specialty ?? specialty;
    if (nextStatus) params.set("status", nextStatus);
    if (nextSpecialty) params.set("specialty", nextSpecialty);
    const qs = params.toString();
    router.replace(qs ? `/dashboard/cards?${qs}` : "/dashboard/cards");
  }

  function toggleStatus(card: CardSummary) {
    const nextStatus: CardStatus =
      card.status === "published" ? "draft" : "published";
    setBusyId(card.id);
    startTransition(async () => {
      applyOptimistic({ type: "status", id: card.id, status: nextStatus });
      const result = await apiRequest(`/api/cards/${card.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setBusyId(null);
      setToast(
        result.ok
          ? {
              tone: "ok",
              text:
                nextStatus === "published"
                  ? "Carte publiée — le QR code est actif."
                  : "Carte repassée en brouillon.",
            }
          : { tone: "error", text: result.error ?? "Action impossible." },
      );
      if (result.ok) router.refresh();
    });
  }

  function removeCard(card: CardSummary) {
    setConfirmId(null);
    setBusyId(card.id);
    startTransition(async () => {
      applyOptimistic({ type: "delete", id: card.id });
      const result = await apiRequest(`/api/cards/${card.id}`, {
        method: "DELETE",
      });
      setBusyId(null);
      setToast(
        result.ok
          ? { tone: "ok", text: "Carte supprimée." }
          : { tone: "error", text: result.error ?? "Suppression impossible." },
      );
      if (result.ok) router.refresh();
    });
  }

  function duplicate(card: CardSummary) {
    setBusyId(card.id);
    startTransition(async () => {
      const result = await apiRequest(`/api/cards/${card.id}/duplicate`, {
        method: "POST",
      });
      setBusyId(null);
      if (result.ok && result.id) {
        setToast({ tone: "ok", text: "Copie créée en brouillon." });
        router.push(`/dashboard/cards/${result.id}`);
      } else {
        setToast({
          tone: "error",
          text: result.error ?? "Duplication impossible.",
        });
      }
    });
  }

  const hasFilters = Boolean(query || status || specialty);

  return (
    <div className="space-y-5">
      <div className="sb-panel flex flex-col gap-3 p-3.5 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blush-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un diagnostic, une spécialité…"
            aria-label="Rechercher une carte"
            className="sb-input pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-xl border border-blush-200 bg-blush-50/60 p-1">
            {[
              { key: "", label: "Toutes" },
              { key: "published", label: "Publiées" },
              { key: "draft", label: "Brouillons" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => pushFilters({ status: option.key })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  status === option.key
                    ? "bg-white text-blush-800 shadow-sm"
                    : "text-plum-900/60 hover:text-blush-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <select
            value={specialty}
            onChange={(event) => pushFilters({ specialty: event.target.value })}
            aria-label="Filtrer par spécialité"
            className="sb-input sm:w-52"
          >
            <option value="">Toutes spécialités</option>
            {specialties.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs font-medium text-plum-900/45">
        {items.length} carte{items.length > 1 ? "s" : ""} affichée
        {items.length > 1 ? "s" : ""}
        {hasFilters ? ` sur ${totalCount}` : ""}
      </p>

      {items.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon="🔎"
            title="Aucun résultat"
            description="Aucune carte ne correspond à ces filtres. Essayez un autre diagnostic ou réinitialisez la recherche."
            action={
              <Link href="/dashboard/cards" className="sb-btn-secondary">
                Réinitialiser les filtres
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="Aucune carte pour l’instant"
            description="Créez votre première carte clinique : un diagnostic, six indices, et le design rose & or se génère tout seul."
            action={
              <Link href="/dashboard/cards/new" className="sb-btn-primary">
                Créer ma première carte
              </Link>
            }
          />
        )
      ) : (
        <ul className="space-y-3">
          {items.map((card) => {
            const busy = busyId === card.id;
            return (
              <li
                key={card.id}
                className={`sb-panel overflow-hidden p-3.5 transition sm:p-4 ${
                  busy ? "opacity-60" : ""
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link
                    href={`/dashboard/cards/${card.id}`}
                    className="mx-auto w-[112px] shrink-0 sm:mx-0"
                    aria-label={`Ouvrir ${card.diagnosis}`}
                  >
                    <CardFront
                      specialty={card.specialty}
                      diagnosis={card.diagnosis}
                      questionLabel={card.questionLabel}
                      clues={card.clues.map((clue) => clue.body)}
                      logoInitials={card.logoInitials}
                      footerLabel={card.footerLabel}
                      socialUrl={card.socialUrl}
                      shareUrl={card.shareCode}
                      className="transition hover:-translate-y-0.5 hover:drop-shadow-lg"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={card.status} />
                      <span className="sb-chip">{card.specialty}</span>
                      <span className="rounded-full border border-blush-100 bg-white px-2 py-1 text-[0.65rem] font-semibold text-plum-900/50">
                        {card.difficulty}
                      </span>
                    </div>

                    <Link href={`/dashboard/cards/${card.id}`}>
                      <h3 className="mt-2 font-serif text-base font-bold leading-snug text-plum-900 hover:text-blush-700 sm:text-lg">
                        {card.diagnosis}
                      </h3>
                    </Link>
                    <p className="mt-1 line-clamp-1 text-xs text-plum-900/55">
                      {card.clues[0]?.body ?? "Aucun indice saisi."}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] text-plum-900/45">
                      <span className="flex items-center gap-1.5">
                        <ClueDots count={card.clues.length} />
                        {card.clues.length}/6 indices
                      </span>
                      <span suppressHydrationWarning>
                        Modifiée {formatRelative(card.updatedAt)}
                      </span>
                      <span>{card.views.toLocaleString("fr-FR")} scans</span>
                      <span>{card.prints} impressions</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
                    <Link
                      href={`/dashboard/cards/${card.id}`}
                      className="sb-btn-secondary flex-1 text-xs px-3 py-2"
                    >
                      Éditer
                    </Link>
                    <Link
                      href={`/dashboard/cards/${card.id}/preview`}
                      className="sb-btn-ghost flex-1 text-xs px-3 py-2"
                    >
                      Aperçu
                    </Link>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleStatus(card)}
                        disabled={busy}
                        className="sb-btn-ghost flex-1 text-xs px-2.5 py-2"
                        title={
                          card.status === "published"
                            ? "Repasser en brouillon"
                            : "Publier"
                        }
                      >
                        {card.status === "published" ? "Dépublier" : "Publier"}
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicate(card)}
                        disabled={busy}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-blush-200 text-plum-900/60 transition hover:border-blush-300 hover:text-blush-700"
                        title="Dupliquer"
                        aria-label="Dupliquer la carte"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <rect x="9" y="9" width="11" height="11" rx="2" />
                          <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(card.id)}
                        disabled={busy}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 text-rose-500 transition hover:bg-rose-50"
                        title="Supprimer"
                        aria-label="Supprimer la carte"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {confirmId === card.id && (
                  <div className="mt-3 flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-medium text-rose-700">
                      Supprimer définitivement «&nbsp;{card.diagnosis}&nbsp;» ?
                      son lien public cessera de fonctionner.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => removeCard(card)}
                        className="sb-btn-danger text-xs px-3 py-1.5"
                      >
                        Supprimer
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="sb-btn-secondary text-xs px-3 py-1.5"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg ${
            toast.tone === "ok"
              ? "bg-plum-900 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
