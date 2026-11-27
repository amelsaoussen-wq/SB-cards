"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui";
import { QuestionEditor } from "@/components/residanat/question-editor";
import { PracticeCard } from "@/components/residanat/practice-card";
import { practiceRequest, PracticeRequestError } from "@/lib/residanat-client";
import { EMPTY_PRACTICE_FILTERS, resolvePracticeView, type EditableQuestion, type PracticeData, type PracticeFilters, type PracticeView } from "@/lib/residanat-model";

const PAGE_SIZE = 20;

function FolderIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3V7Z" /><path d="M3 10h18" /></svg>;
}

export function ResidanatWorkspace({ initial, initialFilters = EMPTY_PRACTICE_FILTERS, initialPage = 1, initialView }: {
  initial: PracticeData;
  initialFilters?: PracticeFilters;
  initialPage?: number;
  initialView?: PracticeView;
}) {
  const [data, setData] = useState(initial);
  const [page, setPage] = useState(initialPage);
  const [view, setView] = useState<PracticeView>(initialView ?? resolvePracticeView(initialFilters));
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ question: EditableQuestion | null } | null>(null);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState(false);
  const [toast, setToast] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);
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

  function rememberLocation(next: PracticeFilters, nextPage: number, nextView: PracticeView) {
    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.specialty) params.set("specialty", next.specialty);
    if (next.lesson) params.set("lesson", next.lesson);
    if (next.document) params.set("document", next.document);
    if (nextView !== "specialties") params.set("view", nextView);
    if (nextView === "questions" && nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/dashboard/residanat?${query}` : "/dashboard/residanat");
  }

  async function reload(next: PracticeFilters = filters, focusId?: string, nextView: PracticeView = view) {
    queryRequest.current?.abort();
    const controller = new AbortController();
    queryRequest.current = controller;
    setFilters(next); setView(nextView); setLoading(true); setError(""); setAuthError(false);
    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.specialty) params.set("specialty", next.specialty);
    if (next.lesson) params.set("lesson", next.lesson);
    if (next.document) params.set("document", next.document);
    try {
      const result = await practiceRequest<PracticeData>(`/api/residanat?${params}`, { signal: controller.signal });
      if (controller.signal.aborted || queryRequest.current !== controller) return;
      setData(result);
      const index = focusId ? result.questions.findIndex((question) => question.id === focusId) : 0;
      const nextPage = Math.floor(Math.max(0, index) / PAGE_SIZE) + 1;
      setPage(nextPage);
      rememberLocation(next, nextPage, nextView);
      if (focusId || nextView !== "specialties") requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ block: "start" }));
    } catch (cause) { if (!(cause instanceof Error && cause.name === "AbortError")) fail(cause); }
    finally { if (queryRequest.current === controller) setLoading(false); }
  }

  function openSpecialty(specialty: string, preserveSearch = false) {
    const q = preserveSearch ? filters.q : "";
    void reload({ ...filters, q, specialty, lesson: "" }, undefined, q.trim() ? "questions" : specialty ? "lessons" : "specialties");
  }
  function openLesson(lesson: string, preserveSearch = false) {
    const q = preserveSearch ? filters.q : "";
    void reload({ ...filters, q, lesson }, undefined, lesson || q.trim() ? "questions" : "lessons");
  }
  function backToSpecialties() {
    void reload({ ...EMPTY_PRACTICE_FILTERS, document: filters.document }, undefined, "specialties");
  }

  async function edit(id: string) {
    setBusyId(id); setError("");
    try { setEditor({ question: await practiceRequest<EditableQuestion>(`/api/residanat/${id}`) }); }
    catch (cause) { fail(cause); }
    finally { setBusyId(null); }
  }

  async function remove(id: string) {
    setBusyId(id); setError("");
    const previous = data;
    setData((current) => ({ ...current, questions: current.questions.filter((item) => item.id !== id) }));
    try {
      await practiceRequest(`/api/residanat/${id}`, { method: "DELETE" });
      setToast("Question supprimée.");
      await reload();
    } catch (cause) { setData(previous); fail(cause); }
    finally { setBusyId(null); }
  }

  const documents = data.documents ?? [];
  const lessons = data.lessons ?? [];
  const attempts = data.stats.correct + data.stats.incorrect;
  const hasFilters = !!(filters.q.trim() || filters.specialty || filters.lesson || filters.document);
  const totalPages = Math.max(1, Math.ceil(data.questions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleQuestions = data.questions.slice(firstIndex, firstIndex + PAGE_SIZE);

  function changePage(next: number) {
    const nextPage = Math.min(totalPages, Math.max(1, next));
    setPage(nextPage);
    rememberLocation(filters, nextPage, "questions");
    resultsRef.current?.scrollIntoView({ block: "start" });
  }
  function pagination(label: string) {
    if (totalPages < 2 || loading || error || view !== "questions") return null;
    return <nav aria-label={label} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blush-200 bg-white px-3 py-3 sm:px-4">
      <button type="button" className="sb-btn-secondary px-3 py-2 text-xs" disabled={currentPage === 1 || !!busyId} onClick={() => changePage(currentPage - 1)}>← Précédent</button>
      <label className="flex items-center gap-2 text-xs font-semibold text-plum-900/60">Page
        <select aria-label="Choisir une page" value={currentPage} onChange={(event) => changePage(Number(event.target.value))} className="rounded-lg border border-blush-200 bg-white px-2 py-1.5 text-blush-800">
          {Array.from({ length: totalPages }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} / {totalPages}</option>)}
        </select>
      </label>
      <button type="button" className="sb-btn-secondary px-3 py-2 text-xs" disabled={currentPage === totalPages || !!busyId} onClick={() => changePage(currentPage + 1)}>Suivant →</button>
    </nav>;
  }

  return <div className="mx-auto max-w-5xl space-y-6">
    <PageHeader eyebrow="Espace privé · SB Cards" title="Résidanat"
      description="Choisissez une spécialité, puis un cours pour retrouver ses QCM. Vos réponses et votre progression restent enregistrées."
      actions={<button type="button" onClick={() => setEditor({ question: null })} className="sb-btn-primary">+ Ajouter un QCM</button>} />
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-300/60 bg-[linear-gradient(120deg,#fffaf0,#fdf0f6)] px-4 py-3">
      <span className="flex items-center gap-2 text-sm font-semibold text-blush-800"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>Réservé au compte propriétaire</span>
      <span className="text-xs text-plum-900/55">Votre banque de révision privée.</span>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Statistiques des QCM">
      {[
        { label: "QCM dans la banque", value: data.stats.total, color: "text-plum-900" },
        { label: "Bonnes réponses", value: data.stats.correct, color: "text-emerald-700" },
        { label: "Réponses incorrectes", value: data.stats.incorrect, color: "text-rose-700" },
        { label: "Réussite", value: attempts ? `${Math.round(data.stats.correct * 100 / attempts)} %` : "—", color: "text-blush-700" },
      ].map((stat) => <div key={stat.label} className="sb-panel p-4"><p className="text-xs font-semibold text-plum-900/50">{stat.label}</p><p className={`mt-2 font-serif text-3xl font-bold ${stat.color}`}>{stat.value}</p></div>)}
    </div>
    <p className="!mt-2 text-xs text-plum-900/45">Les compteurs incluent toutes vos tentatives, y compris les nouvelles tentatives sur une même question.</p>

    <section className="sb-panel p-4 sm:p-5" aria-label="Filtres des questions">
      <form onSubmit={(event) => { event.preventDefault(); void reload(filters, undefined, "questions"); }} className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="sm:col-span-2 xl:col-span-4">
          <label htmlFor="residanat-search" className="sb-label">Rechercher une question</label>
          <input id="residanat-search" type="search" maxLength={160} className="sb-input" placeholder="Un mot de l’énoncé ou Q95…" value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} />
        </div>
        <div>
          <label htmlFor="residanat-specialty-filter" className="sb-label">Spécialité</label>
          <select id="residanat-specialty-filter" className="sb-input" value={filters.specialty} onChange={(event) => openSpecialty(event.target.value, true)}>
            <option value="">Toutes les spécialités</option>
            {filters.specialty && !data.specialties.some((item) => item.name === filters.specialty) && <option value={filters.specialty}>{filters.specialty} (0)</option>}
            {data.specialties.map((item) => <option key={item.name} value={item.name}>{item.name} ({item.count})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="residanat-lesson-filter" className="sb-label">Cours</label>
          <select id="residanat-lesson-filter" className="sb-input" disabled={!filters.specialty || loading} value={filters.lesson} onChange={(event) => openLesson(event.target.value, true)}>
            <option value="">{filters.specialty ? "Choisir un cours" : "Choisir d’abord une spécialité"}</option>
            {filters.lesson && !lessons.some((item) => item.name === filters.lesson) && <option value={filters.lesson}>{filters.lesson} (0)</option>}
            {lessons.map((item) => <option key={item.name} value={item.name}>{item.name} ({item.count})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="residanat-document-filter" className="sb-label">Document</label>
          <select id="residanat-document-filter" className="sb-input" value={filters.document} onChange={(event) => void reload({ ...EMPTY_PRACTICE_FILTERS, document: event.target.value }, undefined, "specialties")}>
            <option value="">Toutes les annales</option>
            {documents.map((item) => <option key={item.id} value={item.id}>{item.title} ({item.remainingCount})</option>)}
          </select>
        </div>
        <button type="submit" disabled={loading} className="sb-btn-primary">{loading ? "Recherche…" : "Rechercher"}</button>
      </form>
      {hasFilters && <button type="button" onClick={() => void reload(EMPTY_PRACTICE_FILTERS, undefined, "specialties")} className="mt-3 text-xs font-semibold text-blush-700 hover:underline">Réinitialiser les filtres</button>}
    </section>

    <div ref={resultsRef} className="scroll-mt-24 space-y-4">
      <nav aria-label="Parcours de révision" className="flex flex-wrap items-center gap-2 text-xs">
        <button type="button" onClick={backToSpecialties} className={`rounded-full border px-3 py-1.5 font-semibold ${view === "specialties" ? "border-blush-300 bg-blush-100 text-blush-800" : "border-blush-200 bg-white text-blush-700"}`} aria-current={view === "specialties" ? "page" : undefined}>1 · Spécialités</button>
        {filters.specialty && <><span aria-hidden="true" className="text-blush-400">›</span><button type="button" onClick={() => openSpecialty(filters.specialty)} className={`rounded-full border px-3 py-1.5 font-semibold ${view === "lessons" ? "border-blush-300 bg-blush-100 text-blush-800" : "border-blush-200 bg-white text-blush-700"}`} aria-current={view === "lessons" ? "page" : undefined}>2 · {filters.specialty}</button></>}
        {view === "questions" && <><span aria-hidden="true" className="text-blush-400">›</span><span aria-current="page" className="max-w-full break-words rounded-full border border-gold-300/70 bg-amber-50 px-3 py-1.5 font-semibold text-amber-900">{filters.lesson ? `3 · ${filters.lesson}` : "QCM"}</span></>}
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 max-w-full">
          <h2 className="break-words font-serif text-xl font-bold">{view === "specialties" ? "Choisir une spécialité" : view === "lessons" ? `Les cours · ${filters.specialty}` : filters.lesson || (filters.q ? "Résultats de recherche" : filters.specialty || "Toutes les questions")}</h2>
          <p className="mt-1 text-xs text-plum-900/55" aria-live="polite">{loading ? "Chargement…" : view === "specialties" ? `${data.specialties.length} spécialités disponibles` : view === "lessons" ? `${lessons.length} cours · ${data.questions.length} QCM` : `${data.questions.length} question${data.questions.length !== 1 ? "s" : ""}`}</p>
        </div>
        {view !== "questions" && <button type="button" disabled={loading} className="sb-btn-secondary px-3 py-2 text-xs" onClick={() => void reload({ ...filters, q: "", lesson: "" }, undefined, "questions")}>Toutes les questions</button>}
      </div>
    </div>
    {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><p>{error}</p><div className="mt-2">{authError ? <Link href="/login?next=/dashboard/residanat" className="font-bold underline">Se reconnecter</Link> : <button type="button" onClick={() => void reload()} className="font-bold underline">Réessayer</button>}</div></div>}

    <div aria-busy={loading} className="space-y-4">
      {loading ? <div role="status" className="sb-panel space-y-4 p-6"><span className="sr-only">Chargement des questions et des cours</span><div className="sb-skeleton h-6 w-3/4" />{[0, 1, 2].map((key) => <div key={key} className="sb-skeleton h-14 w-full" />)}</div>
      : error ? null : view === "specialties" ? (
        data.specialties.length ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {data.specialties.map((item) => <button key={item.name} type="button" data-testid="specialty-card" aria-label={`Ouvrir la spécialité ${item.name}`} onClick={() => openSpecialty(item.name)} className="sb-panel group min-w-0 p-4 text-left transition hover:-translate-y-0.5 hover:border-blush-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blush-500 sm:p-5">
            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blush-100 text-blush-600"><FolderIcon /></span>
            <span className="block break-words font-serif text-base font-bold leading-snug text-plum-900">{item.name}</span>
            <span className="mt-2 block text-xs font-medium text-plum-900/55">{item.lessonCount} cours · {item.count} QCM <span className="ml-1 text-blush-600" aria-hidden="true">→</span></span>
          </button>)}
        </div> : <div className="sb-panel p-8 text-center"><p className="font-serif text-lg font-bold">Aucune spécialité disponible</p><p className="mt-2 text-sm text-plum-900/60">Ajoutez un QCM ou choisissez un autre document.</p><button type="button" className="sb-btn-primary mt-4" onClick={() => setEditor({ question: null })}>+ Ajouter un QCM</button></div>
      ) : view === "lessons" ? (
        lessons.length ? <div className="grid gap-3 sm:grid-cols-2">
          {lessons.map((item) => <button key={item.name} type="button" data-testid="lesson-card" aria-label={`Ouvrir le cours ${item.name}`} onClick={() => openLesson(item.name)} className="sb-panel flex min-w-0 items-center gap-4 p-4 text-left transition hover:border-blush-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blush-500 sm:p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold-300/60 bg-amber-50 text-amber-700"><FolderIcon /></span>
            <span className="min-w-0 flex-1"><span className="block break-words font-serif text-base font-bold">{item.name}</span><span className="mt-1 block text-xs text-plum-900/55">{item.count} QCM</span></span><span className="text-blush-600" aria-hidden="true">→</span>
          </button>)}
        </div> : <div className="sb-panel p-8 text-center"><p className="font-serif text-lg font-bold">Aucun cours pour cette sélection</p><button type="button" onClick={backToSpecialties} className="sb-btn-secondary mt-4">Retour aux spécialités</button></div>
      ) : <>
        {pagination("Pagination des questions")}
        {data.questions.length > 0 && <p className="text-xs text-plum-900/50">Questions {firstIndex + 1}–{Math.min(firstIndex + PAGE_SIZE, data.questions.length)} sur {data.questions.length}</p>}
        {data.questions.length ? visibleQuestions.map((question, index) => <PracticeCard key={`${question.id}:${question.version}`} question={question} sourceDocument={documents.find((item) => item.id === question.documentKey)} index={firstIndex + index}
          busy={busyId === question.id} onEdit={() => void edit(question.id)} onDelete={() => void remove(question.id)}
          onResult={(feedback, stats) => setData((current) => ({ ...current, stats, questions: current.questions.map((item) => item.id === question.id ? { ...item, lastResult: feedback } : item) }))} />)
        : <div className="rounded-3xl border border-dashed border-blush-300 bg-white/70 px-5 py-12 text-center"><p className="font-serif text-xl font-bold">{hasFilters ? "Aucune question correspondante" : "Votre banque de QCM est vide"}</p><p className="mt-2 text-sm text-plum-900/60">Essayez un autre cours, modifiez votre recherche ou ajoutez une question.</p><div className="mt-5 flex flex-wrap justify-center gap-2"><button type="button" className="sb-btn-secondary" onClick={backToSpecialties}>Retour aux spécialités</button><button type="button" className="sb-btn-secondary" onClick={() => void reload(EMPTY_PRACTICE_FILTERS, undefined, "questions")}>Voir toutes les questions</button></div></div>}
        {pagination("Pagination inférieure des questions")}
      </>}
    </div>
    <p className="rounded-2xl border border-blush-100 bg-white/70 px-4 py-3 text-xs leading-relaxed text-plum-900/55">Classement thématique SB Cards, modifiable depuis « Modifier » → « Cours ». Les énoncés, corrigés et résultats ne sont pas modifiés par ce rangement. Les grilles des PDF peuvent contenir des coquilles : vérifiez-les avec vos références de cours à jour.</p>

    {documents.length > 0 && <details data-testid="source-documents" className="sb-panel p-4 sm:p-5">
      <summary className="cursor-pointer font-serif text-lg font-bold text-plum-900">Documents d’origine <span className="ml-2 font-sans text-xs font-medium text-blush-600">{documents.length} fichiers</span></summary>
      <div className="mt-4 space-y-3">{documents.map((document) => <section key={document.id} aria-label="Document PDF importé" className="rounded-2xl border border-gold-300/60 bg-blush-50/40 p-4">
        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-blush-600">Document importé · corrigé inclus</p>
        <h2 className="mt-1.5 font-serif text-lg font-bold">{document.title}</h2>
        <p className="mt-2 text-sm text-plum-900/65">{document.questionCount} questions importées · {document.remainingCount} disponibles dans votre banque.</p>
        <p className="mt-1 text-xs leading-relaxed text-plum-900/55">Grille du document conservée, sans justification médicale ajoutée. Consultez la page source en cas de doute sur la transcription.</p>
        <div className="mt-3 flex flex-wrap gap-2"><button type="button" className="sb-btn-primary text-xs" onClick={() => void reload({ ...EMPTY_PRACTICE_FILTERS, document: document.id }, undefined, "questions")}>Voir ces questions</button><a href={document.sourceUrl} target="_blank" rel="noopener noreferrer" className="sb-btn-secondary text-xs">Ouvrir le PDF source ↗</a></div>
      </section>)}</div>
    </details>}

    {editor && <QuestionEditor question={editor.question} defaultSpecialty={filters.specialty} defaultLesson={filters.lesson} onClose={() => setEditor(null)} onSaved={(id, question) => {
      setEditor(null); setToast("Question enregistrée.");
      void reload({ ...EMPTY_PRACTICE_FILTERS, specialty: question.specialty, lesson: question.lesson ?? "" }, id, "questions");
    }} />}
    {toast && <p role="status" className="fixed bottom-5 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-xl bg-plum-900 px-4 py-3 text-sm font-semibold text-white shadow-lg">{toast}</p>}
  </div>;
}
