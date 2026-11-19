"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { CardInput } from "@/lib/card-types";
import { CLUE_TONES, DIFFICULTIES, SPECIALTIES, TONE_COUNT } from "@/lib/constants";
import { CardBack, CardFront } from "@/components/card-artwork";
import { PageHeader, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";

const EXAMPLE: Pick<CardInput, "diagnosis" | "clues" | "summary"> = {
  diagnosis:
    "Syndrome de Bart de l’hémoglobine / Alpha-thalassémie majeure",
  summary:
    "Hydrops fœtal non immunologique révélant une alpha-thalassémie majeure.",
  clues: [
    "Une femme de 28 ans, enceinte de 24 semaines, est orientée vers le service de médecine materno-fœtale suite à des résultats anormaux lors d’une échographie de routine.",
    "Elle indique qu’on lui a diagnostiqué une anémie durant son enfance, mais elle n’a jamais bénéficié d’un suivi. Elle n’a pas d’autres antécédents médicaux.",
    "Elle et son compagnon sont tous deux originaires du Vietnam.",
    "Son hémogramme révèle une anémie microcytaire hypochrome avec un bilan martial normal.",
    "L’échographie fœtale révèle un œdème fœtal massif, une ascite et des épanchements pleuraux compatibles avec un hydrops fœtal.",
    "L’électrophorèse de l’hémoglobine de deux parents révèle un profil compatible avec le trait thalassémique alpha.",
  ],
};


async function requestJson(
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
            : "Enregistrement impossible. Réessayez."),
      };
    }
    return { ok: data.ok !== false, id: data.id };
  } catch {
    return {
      ok: false,
      error: "Connexion au serveur impossible. Vérifiez votre réseau.",
    };
  }
}

function padClues(clues: string[]): string[] {
  return Array.from({ length: TONE_COUNT }, (_, index) => clues[index] ?? "");
}

function FieldError({ children }: { children: string | null }) {
  if (!children) return null;
  return (
    <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
      {children}
    </p>
  );
}

export function CardEditor({
  initial,
  shareUrl,
  qrDataUrl,
  updatedAt,
}: {
  initial: CardInput;
  shareUrl: string;
  qrDataUrl?: string;
  updatedAt?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<CardInput>({
    ...initial,
    clues: padClues(initial.clues),
  });
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showBrand, setShowBrand] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<"front" | "back">("front");

  const isEditing = Boolean(form.id);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  function update<K extends keyof CardInput>(key: K, value: CardInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateClue(index: number, value: string) {
    setForm((current) => {
      const clues = padClues(current.clues);
      clues[index] = value;
      return { ...current, clues };
    });
  }

  function save(nextStatus?: "draft" | "published") {
    setError(null);
    const payload: CardInput = {
      ...form,
      status: nextStatus ?? form.status,
    };

    if (!payload.diagnosis.trim()) {
      setError("Renseignez le diagnostic qui s’affiche au verso.");
      return;
    }
    if (payload.clues.some((clue) => clue.trim().length < 3)) {
      setError("Les six indices doivent être renseignés (3 caractères min.).");
      return;
    }

    startTransition(async () => {
      const result = form.id
        ? await requestJson(`/api/cards/${form.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await requestJson("/api/cards", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      if (!result.ok) {
        setError(result.error ?? "Enregistrement impossible.");
        return;
      }
      setToast(
        payload.status === "published"
          ? "Carte enregistrée et publiée ✦"
          : "Modifications enregistrées.",
      );
      setForm((current) => ({
        ...current,
        id: result.id ?? current.id,
        status: payload.status,
      }));
      if (!isEditing && result.id) {
        router.push(`/dashboard/cards/${result.id}`);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  }

  function remove() {
    if (!form.id) return;
    startTransition(async () => {
      const result = await requestJson(`/api/cards/${form.id}`, {
        method: "DELETE",
      });
      if (result.ok) {
        router.push("/dashboard/cards");
        router.refresh();
      } else {
        setError(result.error ?? "Suppression impossible.");
      }
    });
  }

  function togglePublished() {
    if (!form.id) {
      update("status", form.status === "published" ? "draft" : "published");
      return;
    }
    const next = form.status === "published" ? "draft" : "published";
    startTransition(async () => {
      const result = await requestJson(`/api/cards/${form.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      if (result.ok) {
        update("status", next);
        setToast(next === "published" ? "Carte publiée." : "Carte dépubliée.");
        router.refresh();
      } else {
        setError(result.error ?? "Action impossible.");
      }
    });
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Impossible de copier le lien.");
    }
  }

  const previewProps = {
    diagnosis: form.diagnosis,
    questionLabel: form.questionLabel,
    clues: form.clues,
    logoInitials: form.logoInitials,
    footerLabel: form.footerLabel,
    socialUrl: form.socialUrl,
    shareUrl,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={isEditing ? "Édition de carte" : "Nouvelle carte"}
        title={isEditing ? "Modifier la carte" : "Générer une carte"}
        description="Le design rose & or reste identique. Modifiez le diagnostic et les six indices : l’aperçu se met à jour instantanément."
        actions={
          <>
            {isEditing && (
              <Link
                href={`/dashboard/cards/${form.id}/preview`}
                className="sb-btn-secondary"
              >
                Aperçu & impression
              </Link>
            )}
            <button
              type="button"
              onClick={togglePublished}
              disabled={pending || (!isEditing && form.status === "published")}
              className="sb-btn-secondary"
              title={
                !isEditing
                  ? "Enregistrez d’abord pour publier"
                  : "Changer la visibilité"
              }
            >
              {form.status === "published" ? "Dépublier" : "Publier"}
            </button>
            <button
              type="button"
              onClick={() => save()}
              disabled={pending}
              className="sb-btn-primary"
            >
              {pending ? "Enregistrement…" : isEditing ? "Enregistrer" : "Générer la carte"}
            </button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-5">
          {error && <FieldError>{error}</FieldError>}

          <section className="sb-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-plum-900">
                  Le diagnostic
                </h2>
                <p className="text-xs text-plum-900/50">
                  La réponse affichée au verso de la carte.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    diagnosis: EXAMPLE.diagnosis,
                    summary: EXAMPLE.summary,
                    clues: padClues(EXAMPLE.clues),
                  }))
                }
                className="sb-btn-ghost text-xs px-2.5 py-1.5"
              >
                Charger un exemple
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="diagnosis" className="sb-label">
                  Diagnostic *
                </label>
                <textarea
                  id="diagnosis"
                  value={form.diagnosis}
                  onChange={(event) => update("diagnosis", event.target.value)}
                  placeholder="Ex. Syndrome de Bart de l’hémoglobine / Alpha-thalassémie majeure"
                  rows={2}
                  className="sb-textarea font-serif text-base font-semibold"
                  maxLength={180}
                />
                <p className="mt-1 text-right text-[0.68rem] text-plum-900/40">
                  {form.diagnosis.length}/180
                </p>
              </div>

              <div>
                <label htmlFor="summary" className="sb-label">
                  Résumé pédagogique
                </label>
                <textarea
                  id="summary"
                  value={form.summary}
                  onChange={(event) => update("summary", event.target.value)}
                  placeholder="Une phrase pour décrire le raisonnement clé…"
                  rows={2}
                  className="sb-textarea"
                  maxLength={280}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="specialty" className="sb-label">
                    Spécialité
                  </label>
                  <select
                    id="specialty"
                    value={form.specialty}
                    onChange={(event) => update("specialty", event.target.value)}
                    className="sb-input"
                  >
                    {SPECIALTIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="difficulty" className="sb-label">
                    Niveau
                  </label>
                  <select
                    id="difficulty"
                    value={form.difficulty}
                    onChange={(event) => update("difficulty", event.target.value)}
                    className="sb-input"
                  >
                    {DIFFICULTIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="sb-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-plum-900">
                  Les six indices
                </h2>
                <p className="text-xs text-plum-900/50">
                  Ordre et couleurs verrouillés — 6 pastilles, 6 indices.
                </p>
              </div>
              <span className="sb-chip">6 / 6</span>
            </div>

            <div className="mt-4 space-y-3">
              {form.clues.map((clue, index) => {
                const tone = CLUE_TONES[index];
                const long = clue.length > 230;
                return (
                  <div
                    key={index}
                    className="rounded-2xl border p-3"
                    style={{
                      backgroundColor: `${tone.card}80`,
                      borderColor: `${tone.border}80`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`clue-${index}`}
                        className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.1em]"
                        style={{ color: tone.circle }}
                      >
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[0.7rem] font-black text-white ring-2 ring-white"
                          style={{ backgroundColor: tone.circle }}
                        >
                          {index + 1}
                        </span>
                        Indice {index + 1} · {tone.name}
                      </label>
                      <span
                        className={`text-[0.65rem] font-medium ${
                          long ? "text-amber-600" : "text-plum-900/40"
                        }`}
                      >
                        {clue.length} car.
                      </span>
                    </div>
                    <textarea
                      id={`clue-${index}`}
                      value={clue}
                      onChange={(event) => updateClue(index, event.target.value)}
                      rows={2}
                      maxLength={320}
                      placeholder={`Indice ${index + 1} — une information clinique…`}
                      className="mt-2 w-full resize-y rounded-xl border border-white/80 bg-white/90 px-3 py-2 font-serif text-sm leading-relaxed text-plum-900 outline-none transition focus:ring-4"
                      style={{ boxShadow: `0 0 0 1px ${tone.border}55` }}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="sb-panel p-5">
            <button
              type="button"
              onClick={() => setShowBrand((value) => !value)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <span>
                <span className="block font-serif text-lg font-bold text-plum-900">
                  Habillage & diffusion
                </span>
                <span className="text-xs text-plum-900/50">
                  Question, initiales, pied de carte et lien social.
                </span>
              </span>
              <span className="text-lg text-blush-500">{showBrand ? "−" : "+"}</span>
            </button>

            {showBrand && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="questionLabel" className="sb-label">
                    Question d’amorçage
                  </label>
                  <input
                    id="questionLabel"
                    value={form.questionLabel}
                    onChange={(event) => update("questionLabel", event.target.value)}
                    className="sb-input"
                    maxLength={60}
                  />
                </div>
                <div>
                  <label htmlFor="logoInitials" className="sb-label">
                    Initiales du logo
                  </label>
                  <input
                    id="logoInitials"
                    value={form.logoInitials}
                    onChange={(event) =>
                      update("logoInitials", event.target.value.toUpperCase().slice(0, 3))
                    }
                    className="sb-input"
                    maxLength={3}
                  />
                </div>
                <div>
                  <label htmlFor="socialUrl" className="sb-label">
                    Lien Facebook
                  </label>
                  <input
                    id="socialUrl"
                    value={form.socialUrl}
                    onChange={(event) => update("socialUrl", event.target.value)}
                    className="sb-input"
                    placeholder="https://facebook.com/…"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="footerLabel" className="sb-label">
                    Pied de carte
                  </label>
                  <input
                    id="footerLabel"
                    value={form.footerLabel}
                    onChange={(event) => update("footerLabel", event.target.value)}
                    className="sb-input"
                    maxLength={80}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-blush-100 pt-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={form.status} />
                <span className="text-xs text-plum-900/45">
                  {isEditing
                    ? "Le QR code pointe vers la page publique de cette carte."
                    : "Enregistrez en brouillon puis publiez pour activer le QR code."}
                </span>
              </div>
              <div className="flex gap-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="sb-btn-danger text-xs px-3 py-2"
                  >
                    Supprimer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => save("published")}
                  disabled={pending || !isEditing}
                  className="sb-btn-secondary text-xs px-3 py-2"
                  title={!isEditing ? "Enregistrez d’abord la carte" : undefined}
                >
                  Enregistrer & publier
                </button>
              </div>
            </div>

            {confirmDelete && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs font-medium text-rose-700">
                  Supprimer cette carte et son lien public ? Cette action est
                  définitive.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={remove}
                    disabled={pending}
                    className="sb-btn-danger text-xs px-3 py-1.5"
                  >
                    Oui, supprimer
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="sb-btn-secondary text-xs px-3 py-1.5"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="sb-panel p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex rounded-xl border border-blush-200 bg-blush-50/70 p-1">
                {[
                  { key: "front" as const, label: "Recto · indices" },
                  { key: "back" as const, label: "Verso · réponse" },
                ].map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setTab(option.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      tab === option.key
                        ? "bg-white text-blush-800 shadow-sm"
                        : "text-plum-900/55 hover:text-blush-800"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-plum-900/35">
                Live
              </span>
            </div>

            <div className="mt-3">
              {tab === "front" ? (
                <CardFront {...previewProps} />
              ) : (
                <CardBack {...previewProps} qrDataUrl={qrDataUrl} />
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={copyShareLink}
                className="sb-btn-secondary flex-1 text-xs px-3 py-2"
              >
                {copied ? "Lien copié ✓" : "Copier le lien public"}
              </button>
              {isEditing && (
                <Link
                  href={`/dashboard/cards/${form.id}/preview`}
                  className="sb-btn-ghost text-xs px-3 py-2"
                >
                  Imprimer
                </Link>
              )}
            </div>
            <p className="mt-2 break-all rounded-lg bg-blush-50 px-2.5 py-1.5 text-[0.65rem] text-plum-900/50">
              {shareUrl}
            </p>
            {updatedAt && (
              <p className="mt-2 text-[0.65rem] text-plum-900/40">
                Dernière modification&nbsp;: {formatDate(updatedAt)}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-gold-300/60 bg-[linear-gradient(150deg,#fffaf0,#fdf0f6)] p-4">
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-gold-500">
              ✦ Design verrouillé
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-plum-900/65">
              Les couleurs des six pastilles, la couronne, le cadre doré et le QR
              code ne sont pas modifiables : toutes vos cartes restent
              reconnaissables.
            </p>
          </div>
        </aside>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-plum-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
