"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui";
import { QuestionEditor } from "@/components/residanat/question-editor";
import { practiceRequest, PracticeRequestError } from "@/lib/residanat-client";
import type { EditableQuestion, PracticeData, PracticeQuestion, PracticeStats, QcmFeedback, PracticeDocument } from "@/lib/residanat-model";

type Filters = { q: string; specialty: string; document: string };
const blankFilters: Filters = { q: "", specialty: "", document: "" };
const PAGE_SIZE = 20;

function PracticeCard({ question, sourceDocument, index, busy, onEdit, onDelete, onResult }: {
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

export function ResidanatWorkspace({ initial, initialFilters = blankFilters, initialPage = 1 }: {
  initial: PracticeData;
  initialFilters?: Filters;
  initialPage?: number;
}) {
  const [data, setData] = useState(initial);
  const [page, setPage] = useState(initialPage);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ question: EditableQuestion | null } | null>(null);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState(false);
  const [toast, setToast] = useState("");
  const queryRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => () => queryRequest.current?.abort(), []);

  function fail(cause: unknown) {
    setError(cause instanceof Error ? cause.message : "La demande a échoué.");
    setAuthError(cause instanceof PracticeRequestError && (cause.status === 401 || cause.status === 403));
  }

  function rememberLocation(next: Filters, nextPage: number) {
    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.specialty) params.set("specialty", next.specialty);
    if (next.document) params.set("document", next.document);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/dashboard/residanat?${query}` : "/dashboard/residanat");
  }

  async function reload(next: Filters = filters, focusId?: string) {
    queryRequest.current?.abort();
    const controller = new AbortController();
    queryRequest.current = controller;
    setLoading(true); setError(""); setAuthError(false);
    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.specialty) params.set("specialty", next.specialty);
    if (next.document) params.set("document", next.document);
    try {
      const result = await practiceRequest<PracticeData>(`/api/residanat?${params}`, { signal: controller.signal });
      setData(result);
      const index = focusId ? result.questions.findIndex((question) => question.id === focusId) : 0;
      const nextPage = Math.floor(Math.max(0, index) / PAGE_SIZE) + 1;
      setPage(nextPage);
      rememberLocation(next, nextPage);
      if (focusId) requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ block: "start" }));
    } catch (cause) { if (!(cause instanceof Error && cause.name === "AbortError")) fail(cause); }
    finally { if (queryRequest.current === controller) setLoading(false); }
  }

  async function edit(question: PracticeQuestion) {
    setBusyId(question.id); setError("");
    try { setEditor({ question: await practiceRequest<EditableQuestion>(`/api/residanat/${question.id}`) }); }
    catch (cause) { fail(cause); }
    finally { setBusyId(null); }
  }

  async function remove(question: PracticeQuestion) {
    setBusyId(question.id); setError("");
    const previous = data;
    // Optimistically remove; restore on failure. Server is the source of truth for totals.
    setData((current) => ({ ...current, questions: current.questions.filter((item) => item.id !== question.id) }));
    try {
      await practiceRequest(`/api/residanat/${question.id}`, { method: "DELETE" });
      setToast("Question supprimée.");
      await reload();
    } catch (cause) { setData(previous); fail(cause); }
    finally { setBusyId(null); }
  }

  const attempts = data.stats.correct + data.stats.incorrect;
  const hasFilters = !!(filters.q.trim() || filters.specialty || filters.document);
  const documents = data.documents ?? [];
  const totalPages = Math.max(1, Math.ceil(data.questions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleQuestions = data.questions.slice(firstIndex, firstIndex + PAGE_SIZE);

  function changePage(next: number) {
    const nextPage = Math.min(totalPages, Math.max(1, next));
    setPage(nextPage);
    rememberLocation(filters, nextPage);
    resultsRef.current?.scrollIntoView({ block: "start" });
  }

  function pagination(label: string) {
    if (totalPages < 2 || loading) return null;
    return (
      <nav aria-label={label} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blush-200 bg-white px-3 py-3 sm:px-4">
        <button type="button" className="sb-btn-secondary px-3 py-2 text-xs" disabled={currentPage === 1 || !!busyId} onClick={() => changePage(currentPage - 1)}>← Précédent</button>
        <label className="flex items-center gap-2 text-xs font-semibold text-plum-900/60">
          Page
          <select aria-label="Choisir une page" value={currentPage} onChange={(event) => changePage(Number(event.target.value))} className="rounded-lg border border-blush-200 bg-white px-2 py-1.5 text-blush-800">
            {Array.from({ length: totalPages }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} / {totalPages}</option>)}
          </select>
        </label>
        <button type="button" className="sb-btn-secondary px-3 py-2 text-xs" disabled={currentPage === totalPages || !!busyId} onClick={() => changePage(currentPage + 1)}>Suivant →</button>
      </nav>
    );
  }


  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader eyebrow="Espace privé · SB Cards" title="Résidanat"
        description="Vos QCM, classés par spécialité. Entraînez-vous à votre rythme et retrouvez chaque corrigé expliqué."
        actions={<button type="button" onClick={() => setEditor({ question: null })} className="sb-btn-primary">+ Ajouter un QCM</button>} />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-300/60 bg-[linear-gradient(120deg,#fffaf0,#fdf0f6)] px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-blush-800">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>
          Réservé au compte propriétaire
        </span>
        <span className="text-xs text-plum-900/55">Ces questions ne sont jamais publiques.</span>
      </div>
      {documents.map((document) => (
        <section key={document.id} aria-label="Document PDF importé" className="sb-panel border-gold-300/70 p-4 sm:p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-blush-600">Document importé · corrigé inclus</p>
          <h2 className="mt-1.5 font-serif text-lg font-bold">{document.title}</h2>
          <p className="mt-2 text-sm text-plum-900/65">{document.questionCount} questions importées · {document.remainingCount} disponibles dans votre banque.</p>
          <p className="mt-1 text-xs leading-relaxed text-plum-900/55">Réponses reproduites du corrigé type du fichier, sans justification médicale ajoutée. Les numéros du PDF sont conservés ; classement thématique SB Cards. Les textes proviennent de scans : consultez le PDF en cas de doute sur un terme ou une unité.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="sb-btn-primary text-xs" onClick={() => {
              const next = { ...blankFilters, document: document.id }; setFilters(next); void reload(next);
            }}>Voir ces questions</button>
            <a href={document.sourceUrl} target="_blank" rel="noopener noreferrer" className="sb-btn-secondary text-xs">Ouvrir le PDF source ↗</a>
          </div>
        </section>
      ))}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Statistiques des QCM">
        {[
          { label: "QCM dans la banque", value: data.stats.total, color: "text-plum-900" },
          { label: "Bonnes réponses", value: data.stats.correct, color: "text-emerald-700" },
          { label: "Réponses incorrectes", value: data.stats.incorrect, color: "text-rose-700" },
          { label: "Réussite", value: attempts ? `${Math.round(data.stats.correct * 100 / attempts)} %` : "—", color: "text-blush-700" },
        ].map((stat) => <div key={stat.label} className="sb-panel p-4">
          <p className="text-xs font-semibold text-plum-900/50">{stat.label}</p>
          <p className={`mt-2 font-serif text-3xl font-bold ${stat.color}`}>{stat.value}</p>
        </div>)}
      </div>
      <p className="!mt-2 text-xs text-plum-900/45">Les compteurs incluent toutes vos tentatives enregistrées, y compris les nouvelles tentatives sur une même question.</p>

      <section className="sb-panel p-4 sm:p-5" aria-label="Filtres des questions">
        <form onSubmit={(event) => { event.preventDefault(); void reload(); }} className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_200px_200px_auto]">
          <div>
            <label htmlFor="residanat-search" className="sb-label">Rechercher une question</label>
            <input id="residanat-search" type="search" maxLength={160} value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })}
              placeholder="Un mot de l’énoncé ou Q95…" className="sb-input" />
          </div>
          <div>
            <label htmlFor="residanat-specialty-filter" className="sb-label">Spécialité</label>
            <select id="residanat-specialty-filter" value={filters.specialty} className="sb-input" onChange={(event) => {
              const next = { ...filters, specialty: event.target.value }; setFilters(next); void reload(next);
            }}>
              <option value="">Toutes les spécialités</option>
              {data.specialties.map((item) => <option key={item.name} value={item.name}>{item.name} ({item.count})</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="residanat-document-filter" className="sb-label">Document</label>
            <select id="residanat-document-filter" value={filters.document} className="sb-input" onChange={(event) => {
              const next = { ...filters, specialty: "", document: event.target.value }; setFilters(next); void reload(next);
            }}>
              <option value="">Toute ma banque</option>
              {documents.map((item) => <option key={item.id} value={item.id}>{item.title} ({item.remainingCount})</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading} className="sb-btn-primary">{loading ? "Recherche…" : "Rechercher"}</button>
        </form>
        {hasFilters && <button type="button" onClick={() => { setFilters(blankFilters); void reload(blankFilters); }} className="mt-3 text-xs font-semibold text-blush-700 hover:underline">Réinitialiser les filtres</button>}
      </section>
      {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        <p>{error}</p>
        <div className="mt-2 flex gap-3">
          {authError ? <Link href="/login?next=/dashboard/residanat" className="font-bold underline">Se reconnecter</Link> : <button type="button" onClick={() => void reload()} className="font-bold underline">Réessayer</button>}
        </div>
      </div>}
      <div ref={resultsRef} className="flex scroll-mt-24 items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-bold">{filters.specialty || "Questions par spécialité"}</h2>
        <span className="text-xs font-medium text-plum-900/50" aria-live="polite">{loading ? "Chargement…" : `${data.questions.length} question${data.questions.length !== 1 ? "s" : ""}`}</span>
      </div>
      {pagination("Pagination des questions")}
      {!loading && data.questions.length > 0 && <p className="text-xs text-plum-900/50" aria-live="polite">Questions {firstIndex + 1}–{Math.min(firstIndex + PAGE_SIZE, data.questions.length)} sur {data.questions.length}</p>}
      <div aria-busy={loading} className="space-y-4">
        {loading ? <div role="status" className="sb-panel space-y-4 p-6"><span className="sr-only">Chargement des questions</span><div className="sb-skeleton h-6 w-3/4" />{[0, 1, 2, 3].map((key) => <div key={key} className="sb-skeleton h-12 w-full" />)}</div>
        : data.questions.length ? visibleQuestions.map((question, index) => <PracticeCard key={`${question.id}:${question.version}`} question={question} sourceDocument={documents.find((item) => item.id === question.documentKey)} index={firstIndex + index}
          busy={busyId === question.id} onEdit={() => void edit(question)} onDelete={() => void remove(question)}
          onResult={(feedback, stats) => setData((current) => ({ ...current, stats, questions: current.questions.map((item) => item.id === question.id ? { ...item, lastResult: feedback } : item) }))} />)
        : <div className="rounded-3xl border border-dashed border-blush-300 bg-white/70 px-5 py-12 text-center">
          <p className="font-serif text-xl font-bold">{hasFilters ? "Aucune question correspondante" : "Votre banque de QCM est vide"}</p>
          <p className="mt-2 text-sm text-plum-900/60">{hasFilters ? "Essayez un autre terme ou une autre spécialité." : "Ajoutez une question et son corrigé pour commencer vos révisions."}</p>
          <button type="button" className="sb-btn-secondary mt-5" onClick={() => { if (hasFilters) { setFilters(blankFilters); void reload(blankFilters); } else setEditor({ question: null }); }}>{hasFilters ? "Voir toutes les questions" : "+ Ajouter une question"}</button>
        </div>}
      </div>
      {pagination("Pagination inférieure des questions")}
      <p className="rounded-2xl border border-blush-100 bg-white/70 px-4 py-3 text-xs leading-relaxed text-plum-900/55">
        Les questions marquées PDF proviennent du document associé, avec sa grille de correction, qui peut contenir des coquilles. Les autres exemples SB Cards sont des exercices pédagogiques originaux. Vérifiez les corrigés avec vos références de cours à jour ; cet espace ne fournit pas de conseils médicaux personnalisés.
      </p>
      {editor && <QuestionEditor question={editor.question} onClose={() => setEditor(null)} onSaved={(id) => {
        setEditor(null); setToast("Question enregistrée."); setFilters(blankFilters); void reload(blankFilters, id);
      }} />}
      {toast && <p role="status" className="fixed bottom-5 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-xl bg-plum-900 px-4 py-3 text-sm font-semibold text-white shadow-lg">{toast}</p>}
    </div>
  );
}
