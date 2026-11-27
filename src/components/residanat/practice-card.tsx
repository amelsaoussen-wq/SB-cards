"use client";

import { useRef, useState } from "react";
import { practiceRequest } from "@/lib/residanat-client";
import type { PracticeQuestion, PracticeStats, QcmFeedback, PracticeDocument } from "@/lib/residanat-model";

export function PracticeCard({ question, sourceDocument, index, busy, onEdit, onDelete, onResult }: {
  question: PracticeQuestion;
  sourceDocument?: PracticeDocument;
  index: number;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onResult: (feedback: QcmFeedback, stats: PracticeStats) => void;
}) {
  const [selection, setSelection] = useState<string[]>(question.lastResult?.selectedOptionIds ?? []);
  const [feedback, setFeedback] = useState<QcmFeedback | null>(question.lastResult);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const attempt = useRef<{ id: string; selection: string } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selection.length || pending || feedback) return;
    setPending(true); setError("");
    const signature = [...selection].sort().join(",");
    if (!attempt.current || attempt.current.selection !== signature) attempt.current = { id: crypto.randomUUID(), selection: signature };
    try {
      const result = await practiceRequest<{ feedback: QcmFeedback; stats: PracticeStats }>(`/api/residanat/${question.id}/answer`, {
        method: "POST", body: JSON.stringify({ attemptId: attempt.current.id, version: question.version, selectedOptionIds: selection }),
      });
      setFeedback(result.feedback);
      onResult(result.feedback, result.stats);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Correction indisponible. Réessayez."); }
    finally { setPending(false); }
  }

  const cardTone = feedback
    ? feedback.isCorrect ? "border-emerald-300 bg-emerald-50/40" : "border-rose-300 bg-rose-50/40"
    : "border-blush-200/80 bg-white";

  return (
    <article data-testid="qcm-question" data-question-id={question.id}
      className={`rounded-3xl border p-4 shadow-soft transition-colors sm:p-6 ${cardTone} ${busy ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blush-100 font-serif text-sm font-bold text-blush-800">{String(question.sourceNumber ?? index + 1).padStart(2, "0")}</span>
          <span className="sb-chip">{question.specialty}</span>
          <span className="max-w-full break-words text-xs font-medium text-blush-700">{question.lesson}</span>
          <span className="text-xs text-plum-900/50">{question.multiple ? "Choix multiples" : "Choix unique"}</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" disabled={busy || pending} onClick={onEdit} className="sb-btn-ghost px-2 py-1 text-xs" aria-label="Modifier la question">Modifier</button>
          <button type="button" disabled={busy || pending} onClick={() => setConfirmDelete(!confirmDelete)} className="sb-btn-ghost px-2 py-1 text-xs text-rose-700" aria-label="Supprimer la question">Supprimer</button>
        </div>
      </div>
      {confirmDelete && <div className="mt-3 rounded-xl border border-rose-200 bg-white p-3">
        <p className="text-sm text-rose-800">Supprimer cette question et ses tentatives ? Cette action est définitive.</p>
        <div className="mt-2 flex gap-2">
          <button type="button" disabled={busy} className="sb-btn-danger px-3 py-1.5 text-xs" onClick={onDelete}>Confirmer la suppression</button>
          <button type="button" className="sb-btn-secondary px-3 py-1.5 text-xs" onClick={() => setConfirmDelete(false)}>Annuler</button>
        </div>
      </div>}
      {sourceDocument && question.sourceNumber && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-plum-900/55">
          <span className="rounded-full border border-gold-300/60 bg-amber-50 px-2.5 py-1 font-semibold text-amber-900">PDF · Question {question.sourceNumber}</span>
          <a href={`${sourceDocument.sourceUrl.split("#")[0]}#page=${question.sourcePage ?? 1}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blush-700 underline underline-offset-2">
            Voir l’énoncé · page {question.sourcePage} ↗
          </a>
        </div>
      )}
      <h2 id={`prompt-${question.id}`} className="mt-4 whitespace-pre-wrap font-serif text-lg font-bold leading-relaxed sm:text-xl">{question.prompt}</h2>
      <form onSubmit={submit} className="mt-4">
        <fieldset disabled={pending || !!feedback || busy} aria-labelledby={`prompt-${question.id}`} className="space-y-2.5">
          <legend className="sr-only">{question.multiple ? "Sélectionnez toutes les bonnes réponses" : "Sélectionnez une réponse"}</legend>
          {question.options.map((option) => {
            const selected = selection.includes(option.id);
            const correct = !!feedback?.correctOptionIds.includes(option.id);
            const wrong = !!feedback && selected && !correct;
            const style = correct ? "border-emerald-400 bg-emerald-50 text-emerald-950" : wrong
              ? "border-rose-400 bg-rose-50 text-rose-950" : selected
              ? "border-blush-500 bg-blush-50 ring-1 ring-blush-200" : "border-blush-100 bg-white hover:border-blush-300";
            return (
              <label key={option.id} data-option-id={option.id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 text-sm transition sm:px-4 ${style} ${feedback || pending ? "!cursor-default" : ""}`}>
                <input type={question.multiple ? "checkbox" : "radio"} name={`answer-${question.id}`} value={option.id} aria-label={`Proposition ${option.id} : ${option.text}`}
                  checked={selected} className="mt-1 h-4 w-4 shrink-0 accent-blush-600"
                  onChange={() => {
                    setError("");
                    setSelection((current) => question.multiple ? current.includes(option.id) ? current.filter((id) => id !== option.id) : [...current, option.id] : [option.id]);
                  }} />
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${correct ? "bg-emerald-600 text-white" : wrong ? "bg-rose-600 text-white" : "bg-blush-100 text-blush-700"}`}>{option.id}</span>
                <span className="min-w-0 flex-1 leading-relaxed">{option.text}
                  {feedback && (correct || wrong) && <span className={`mt-1 block text-xs font-semibold ${correct ? "text-emerald-700" : "text-rose-700"}`}>
                    {correct ? selected ? "✓ Bonne réponse" : "✓ Réponse correcte non sélectionnée" : "✕ Proposition incorrecte"}
                  </span>}
                </span>
              </label>
            );
          })}
        </fieldset>
        {error && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-white p-3 text-sm text-rose-700">{error}</p>}
        {feedback ? (
          <div className="mt-4">
            <div role="status" data-testid="qcm-feedback" className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${feedback.isCorrect ? "border-emerald-200 bg-emerald-100/70 text-emerald-800" : "border-rose-200 bg-rose-100/70 text-rose-800"}`}>
              <span aria-hidden="true">{feedback.isCorrect ? "✓" : "✕"}</span>
              {feedback.isCorrect ? "Bonne réponse !" : "Réponse incorrecte — consultez le corrigé."}
            </div>
            <details open className="mt-3 rounded-2xl border border-blush-200/70 bg-white p-4">
              <summary className="cursor-pointer font-serif text-base font-bold">{sourceDocument ? question.version > 1 ? "Corrigé personnalisé" : "Corrigé du document" : "Comprendre la réponse"}</summary>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-blush-700">Réponse{feedback.correctOptionIds.length > 1 ? "s" : ""} : {feedback.correctOptionIds.join(", ")}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-plum-900/80">{feedback.explanation}</p>
              {question.source && <p className="mt-3 break-words border-t border-blush-100 pt-3 text-xs text-plum-900/50">Source : {question.source}</p>}
            </details>
            <button type="button" className="sb-btn-secondary mt-3 text-xs" onClick={() => { setFeedback(null); setSelection([]); setError(""); attempt.current = null; }}>
              Réessayer cette question
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-plum-900/50">{question.multiple ? "Toutes les bonnes réponses, sans proposition supplémentaire." : "Une seule proposition à sélectionner."}</p>
            <button type="submit" disabled={!selection.length || pending || busy} className="sb-btn-primary text-sm">
              {pending ? "Correction…" : "Valider ma réponse"}
            </button>
          </div>
        )}
      </form>
    </article>
  );
}
