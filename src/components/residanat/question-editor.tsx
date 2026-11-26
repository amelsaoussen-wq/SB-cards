"use client";

import { useEffect, useRef, useState } from "react";
import { RESIDANAT_SPECIALTIES, validateQcm, type EditableQuestion, type QcmInput } from "@/lib/residanat-model";
import { practiceRequest } from "@/lib/residanat-client";

function emptyQuestion(): QcmInput {
  return { specialty: "Cardiologie", prompt: "", options: ["A", "B", "C", "D"].map((id) => ({ id, text: "" })),
    correctOptionIds: [], explanation: "", source: "" };
}

export function QuestionEditor({ question, onClose, onSaved }: {
  question: EditableQuestion | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState<QcmInput>(() => question ?? emptyQuestion());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = overflow; };
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validated = validateQcm(value);
    if ("error" in validated) { setError(validated.error); return; }
    setSaving(true); setError("");
    try {
      await practiceRequest(question ? `/api/residanat/${question.id}` : "/api/residanat", {
        method: question ? "PUT" : "POST", body: JSON.stringify(validated.data),
      });
      onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Enregistrement impossible."); }
    finally { setSaving(false); }
  }

  function toggleCorrect(id: string) {
    setValue((current) => ({ ...current, correctOptionIds: current.correctOptionIds.includes(id)
      ? current.correctOptionIds.filter((key) => key !== id) : [...current.correctOptionIds, id] }));
  }

  return (
    <dialog ref={dialogRef} aria-labelledby="qcm-editor-title"
      onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-3xl border border-blush-200 bg-white p-0 text-plum-900 shadow-2xl backdrop:bg-plum-900/45 backdrop:backdrop-blur-sm">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-blush-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-blush-500">Résidanat · question privée</p>
          <h2 id="qcm-editor-title" className="mt-1 font-serif text-xl font-bold">{question ? "Modifier le QCM" : "Nouveau QCM"}</h2>
        </div>
        <button type="button" onClick={onClose} disabled={saving} className="sb-btn-ghost" aria-label="Fermer l’éditeur">Fermer</button>
      </div>
      <form onSubmit={save} className="space-y-5 p-5 sm:p-7">
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <fieldset disabled={saving} className="space-y-5 disabled:opacity-70">
          <div>
            <label htmlFor="qcm-specialty" className="sb-label">Spécialité</label>
            <select id="qcm-specialty" className="sb-input" value={value.specialty} onChange={(event) => setValue({ ...value, specialty: event.target.value })}>
              {RESIDANAT_SPECIALTIES.map((name) => <option key={name}>{name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="qcm-prompt" className="sb-label">Énoncé de la question</label>
            <textarea id="qcm-prompt" required minLength={3} maxLength={3000} rows={4} className="sb-textarea"
              value={value.prompt} onChange={(event) => setValue({ ...value, prompt: event.target.value })} placeholder="Saisissez votre question…" />
          </div>
          <fieldset className="space-y-3">
            <legend className="font-serif text-lg font-bold">Propositions & bonnes réponses</legend>
            <p className="text-xs leading-relaxed text-plum-900/60">Cochez chaque réponse correcte. Une case cochée : choix unique. Plusieurs cases : choix multiples.</p>
            {value.options.map((option) => (
              <div key={option.id} className={`rounded-2xl border p-3 ${value.correctOptionIds.includes(option.id) ? "border-emerald-200 bg-emerald-50/60" : "border-blush-200 bg-blush-50/40"}`}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold">
                    <input type="checkbox" aria-label={`Réponse correcte ${option.id}`} checked={value.correctOptionIds.includes(option.id)}
                      onChange={() => toggleCorrect(option.id)} className="h-4 w-4 accent-emerald-600" />
                    {option.id} · Bonne réponse
                  </label>
                  <button type="button" disabled={value.options.length <= 2} className="text-xs font-semibold text-rose-700 disabled:opacity-30"
                    aria-label={`Retirer la proposition ${option.id}`} onClick={() => setValue({ ...value,
                      options: value.options.filter((item) => item.id !== option.id), correctOptionIds: value.correctOptionIds.filter((id) => id !== option.id) })}>
                    Retirer
                  </button>
                </div>
                <textarea aria-label={`Proposition ${option.id}`} required maxLength={600} rows={2} className="sb-textarea min-h-16" value={option.text}
                  onChange={(event) => setValue({ ...value, options: value.options.map((item) => item.id === option.id ? { ...item, text: event.target.value } : item) })} />
              </div>
            ))}
            {value.options.length < 6 && <button type="button" className="sb-btn-secondary text-xs" onClick={() => {
              const id = ["A", "B", "C", "D", "E", "F"].find((letter) => !value.options.some((option) => option.id === letter));
              if (id) setValue({ ...value, options: [...value.options, { id, text: "" }] });
            }}>+ Ajouter une proposition</button>}
          </fieldset>
          <div>
            <label htmlFor="qcm-explanation" className="sb-label">Corrigé expliqué</label>
            <textarea id="qcm-explanation" required minLength={10} maxLength={5000} rows={4} className="sb-textarea" value={value.explanation}
              onChange={(event) => setValue({ ...value, explanation: event.target.value })} placeholder="Pourquoi ces propositions sont-elles correctes ?" />
            <p className="mt-1 text-xs text-plum-900/55">Le corrigé apparaît après validation, pas avant.</p>
          </div>
          <div>
            <label htmlFor="qcm-source" className="sb-label">Référence ou origine (facultatif)</label>
            <input id="qcm-source" maxLength={500} className="sb-input" value={value.source} onChange={(event) => setValue({ ...value, source: event.target.value })}
              placeholder="Ouvrage, cours, année, lien de la source autorisée…" />
          </div>
        </fieldset>
        <p className="rounded-xl border border-gold-300/60 bg-amber-50/60 px-3 py-2 text-xs text-plum-900/70">Ce QCM reste privé. Il ne sera ni publié dans la communauté, ni ajouté aux cartes publiques.</p>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" disabled={saving} onClick={onClose} className="sb-btn-secondary">Annuler</button>
          <button type="submit" disabled={saving} className="sb-btn-primary">{saving ? "Enregistrement…" : "Enregistrer le QCM"}</button>
        </div>
      </form>
    </dialog>
  );
}
