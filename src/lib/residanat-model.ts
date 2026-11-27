import { cleanLesson, inferResidanatLesson } from "@/lib/residanat-course-map";

export const RESIDANAT_SPECIALTIES = [
  "Anatomie pathologique",
  "Anesthésie-réanimation",
  "Biochimie",
  "Biologie moléculaire",
  "Cardiologie",
  "Chirurgie digestive",
  "Chirurgie endocrinienne",
  "Dermatologie",
  "Endocrinologie",
  "Gynécologie-obstétrique",
  "Gériatrie",
  "Hématologie",
  "Hépato-gastro-entérologie",
  "Immunologie",
  "Infectiologie",
  "Médecine interne",
  "Médecine légale",
  "Neurochirurgie",
  "Neurologie",
  "Néphrologie",
  "ORL",
  "Ophtalmologie",
  "Physiologie",
  "Pneumologie",
  "Psychiatrie",
  "Pédiatrie",
  "Rhumatologie",
  "Santé publique",
  "Traumatologie-orthopédie",
  "Urgences",
  "Urologie",
] as const;

export type QcmOption = { id: string; text: string };
export type QcmInput = {
  specialty: string;
  lesson?: string;
  prompt: string;
  options: QcmOption[];
  correctOptionIds: string[];
  explanation: string;
  source: string;
  version?: number;
};
export type QcmFeedback = {
  isCorrect: boolean;
  selectedOptionIds: string[];
  correctOptionIds: string[];
  explanation: string;
};
export type PracticeQuestion = {
  id: string;
  specialty: string;
  lesson: string;
  prompt: string;
  options: QcmOption[];
  multiple: boolean;
  source: string;
  version: number;
  documentKey: string | null;
  sourceNumber: number | null;
  sourcePage: number | null;
  lastResult: QcmFeedback | null;
};
export type PracticeStats = {
  total: number;
  correct: number;
  incorrect: number;
};
export type PracticeDocument = {
  id: string;
  title: string;
  sourceUrl: string;
  questionCount: number;
  remainingCount: number;
  importedAt: string;
};
export type PracticeData = {
  questions: PracticeQuestion[];
  specialties: { name: string; count: number; lessonCount: number }[];
  lessons: { name: string; count: number }[];
  stats: PracticeStats;
  documents: PracticeDocument[];
};
export type PracticeFilters = { q: string; specialty: string; lesson: string; document: string };
export type PracticeView = "specialties" | "lessons" | "questions";
export const EMPTY_PRACTICE_FILTERS: PracticeFilters = { q: "", specialty: "", lesson: "", document: "" };
export function resolvePracticeView(filters: PracticeFilters, requested?: string): PracticeView {
  if (requested === "questions") return "questions";
  if (requested === "lessons" && filters.specialty) return "lessons";
  if (requested === "specialties") return "specialties";
  if (filters.q.trim() || filters.lesson) return "questions";
  return filters.specialty ? "lessons" : "specialties";
}
export type EditableQuestion = QcmInput & { id: string; version: number };

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateQcm(raw: unknown): { data: QcmInput } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "Données invalides." };
  const value = raw as Record<string, unknown>;
  if (typeof value.prompt !== "string" || value.prompt.trim().length < 3 || value.prompt.length > 3000) {
    return { error: "L’énoncé doit contenir entre 3 et 3 000 caractères." };
  }
  if (typeof value.specialty !== "string" || !RESIDANAT_SPECIALTIES.includes(value.specialty as typeof RESIDANAT_SPECIALTIES[number])) {
    return { error: "Choisissez une spécialité dans la liste." };
  }
  if (value.lesson !== undefined && (typeof value.lesson !== "string" || cleanLesson(value.lesson).length > 120 || /[\u0000-\u001f\u007f]/.test(value.lesson))) {
    return { error: "Le nom du cours doit contenir au maximum 120 caractères, sans caractères de contrôle." };
  }
  const lesson = value.lesson === undefined ? undefined
    : cleanLesson(value.lesson as string) || inferResidanatLesson(value.specialty, value.prompt);
  if (!Array.isArray(value.options) || value.options.length < 2 || value.options.length > 6) {
    return { error: "Ajoutez entre 2 et 6 propositions." };
  }
  const options: QcmOption[] = [];
  for (const option of value.options) {
    if (!option || typeof option !== "object" || typeof option.id !== "string" || !/^[A-F]$/.test(option.id) || typeof option.text !== "string" || !option.text.trim() || option.text.length > 600) {
      return { error: "Chaque proposition doit avoir une lettre A–F et un texte (600 caractères maximum)." };
    }
    options.push({ id: option.id, text: option.text.trim() });
  }
  if (new Set(options.map((option) => option.id)).size !== options.length || new Set(options.map((option) => option.text.toLowerCase())).size !== options.length) {
    return { error: "Les lettres et les textes des propositions doivent être distincts." };
  }
  if (!Array.isArray(value.correctOptionIds) || !value.correctOptionIds.length || !value.correctOptionIds.every((id) => typeof id === "string" && options.some((option) => option.id === id)) || new Set(value.correctOptionIds).size !== value.correctOptionIds.length) {
    return { error: "Indiquez au moins une bonne réponse parmi les propositions." };
  }
  if (typeof value.explanation !== "string" || value.explanation.trim().length < 10 || value.explanation.length > 5000) {
    return { error: "Le corrigé doit contenir entre 10 et 5 000 caractères." };
  }
  if (value.source !== undefined && (typeof value.source !== "string" || value.source.length > 500)) {
    return { error: "La référence doit contenir au maximum 500 caractères." };
  }
  return { data: {
    prompt: value.prompt.trim(),
    specialty: value.specialty,
    lesson,
    options,
    correctOptionIds: [...value.correctOptionIds].sort(),
    explanation: value.explanation.trim(),
    source: typeof value.source === "string" ? value.source.trim() : "",
    version: typeof value.version === "number" ? value.version : undefined,
  } };
}

export function gradeSelection(selected: string[], correct: string[]): boolean {
  const actual = [...new Set(selected)].sort();
  const expected = [...new Set(correct)].sort();
  return actual.length === expected.length && actual.every((id, index) => id === expected[index]);
}
