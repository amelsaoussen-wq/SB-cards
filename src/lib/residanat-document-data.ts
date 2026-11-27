import "server-only";

import exam2026 from "@/data/residanat/constantine-2026.json";
import exam2025 from "@/data/residanat/constantine-2025.json";
import { validateQcm, type QcmInput, type QcmOption } from "@/lib/residanat-model";

type SourceExam = {
  id: string;
  title: string;
  sourceUrl: string;
  sourceSha256: string;
  pageCount: number;
  questionCount: number;
  answerPages: number[];
  questions: Array<{
    number: number;
    page: number;
    specialty: string;
    prompt: string;
    options: QcmOption[];
    correctOptionIds: string[];
    transcriptionNote?: string;
  }>;
};
type RegisteredExam = {
  exam: SourceExam;
  reference: string;
  answerSections: Array<{ first: number; last: number; page: number }>;
};
const registry: RegisteredExam[] = [
  { exam: exam2026, reference: "Constantine — 17/10/2026", answerSections: [{ first: 1, last: 100, page: 20 }, { first: 101, last: 150, page: 21 }] },
  { exam: exam2025, reference: "Constantine — 25/10/2025", answerSections: [{ first: 1, last: 100, page: 21 }, { first: 101, last: 150, page: 22 }] },
];

if (new Set(registry.map(({ exam }) => exam.id)).size !== registry.length ||
    new Set(registry.map(({ exam }) => exam.sourceSha256)).size !== registry.length) {
  throw new Error("Duplicate reviewed source document");
}

export const REVIEWED_DOCUMENTS = registry.map(({ exam }) => ({
  id: exam.id,
  title: exam.title,
  sourceUrl: exam.sourceUrl,
  sourceSha256: exam.sourceSha256,
  questionCount: exam.questionCount,
}));
// Kept for compatibility with the original single-document import.
export const CONSTANTINE_DOCUMENT = REVIEWED_DOCUMENTS[0];

type ReviewedQuestion = QcmInput & { sourceNumber: number; sourcePage: number };
const reviewed = new Map<string, ReviewedQuestion[]>();

/** Only server modules load this registry. Unattempted answer keys never reach the browser. */
export function reviewedDocumentQuestions(documentKey: string): ReviewedQuestion[] {
  const cached = reviewed.get(documentKey);
  if (cached) return cached;
  const registered = registry.find(({ exam }) => exam.id === documentKey);
  if (!registered) throw new Error("Unknown reviewed source document");
  const { exam } = registered;
  if (exam.questions.length !== 150 || exam.questionCount !== 150) throw new Error("Invalid reviewed document length");
  const result = exam.questions.map((question, index) => {
    const answerPage = registered.answerSections.find((section) => question.number >= section.first && question.number <= section.last)?.page;
    if (question.number !== index + 1 || question.options.length !== 5 || question.options.map((option) => option.id).join("") !== "ABCDE" ||
        !Number.isInteger(question.page) || question.page < 1 || question.page >= Math.min(...exam.answerPages) ||
        !answerPage || !exam.answerPages.includes(answerPage) || answerPage > exam.pageCount) {
      throw new Error(`Invalid source structure at question ${index + 1}`);
    }
    const input: QcmInput = {
      specialty: question.specialty,
      prompt: question.prompt,
      options: question.options,
      correctOptionIds: question.correctOptionIds,
      explanation: [
        `Corrigé type du PDF fourni — question ${question.number} : ${question.correctOptionIds.join(", ")}.`,
        `Grille de correction : page ${answerPage} du PDF. Énoncé : page ${question.page}.`,
        "Le fichier donne les lettres des réponses, sans justification médicale détaillée. Cette grille est reproduite telle quelle et peut contenir des coquilles ; vérifiez avec votre référentiel à jour.",
        question.transcriptionNote,
      ].filter(Boolean).join("\n\n"),
      source: `${registered.reference} · Q. ${question.number} · p. ${question.page} · corrigé p. ${answerPage} · ${exam.sourceUrl}`,
    };
    const validation = validateQcm(input);
    if ("error" in validation) throw new Error(`Invalid reviewed question ${question.number}: ${validation.error}`);
    return { ...validation.data, sourceNumber: question.number, sourcePage: question.page };
  });
  reviewed.set(documentKey, result);
  return result;
}

export function reviewedConstantineQuestions(): ReviewedQuestion[] {
  return reviewedDocumentQuestions(exam2026.id);
}
