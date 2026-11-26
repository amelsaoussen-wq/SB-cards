import "server-only";

import exam from "@/data/residanat/constantine-2026.json";
import { validateQcm, type QcmInput } from "@/lib/residanat-model";

export const CONSTANTINE_DOCUMENT = {
  id: exam.id,
  title: exam.title,
  sourceUrl: exam.sourceUrl,
  sourceSha256: exam.sourceSha256,
  questionCount: exam.questionCount,
};

let reviewed: Array<QcmInput & { sourceNumber: number; sourcePage: number }> | null = null;

/** Only imported by server modules; the answer key is never bundled into browser JavaScript. */
export function reviewedConstantineQuestions(): Array<QcmInput & { sourceNumber: number; sourcePage: number }> {
  if (reviewed) return reviewed;
  if (exam.questions.length !== 150 || exam.questionCount !== 150) throw new Error("Invalid reviewed document length");
  reviewed = exam.questions.map((question, index) => {
    if (question.number !== index + 1 || question.options.length !== 5 || question.options.map((option) => option.id).join("") !== "ABCDE" || question.page < 1 || question.page > 19) {
      throw new Error(`Invalid source structure at question ${index + 1}`);
    }
    const answerPage = question.number <= 100 ? 20 : 21;
    const note = "transcriptionNote" in question ? question.transcriptionNote : "";
    const input: QcmInput = {
      specialty: question.specialty,
      prompt: question.prompt,
      options: question.options,
      correctOptionIds: question.correctOptionIds,
      explanation: [
        `Corrigé type du PDF fourni — question ${question.number} : ${question.correctOptionIds.join(", ")}.`,
        `Grille de correction : page ${answerPage} du PDF. Énoncé : page ${question.page}.`,
        "Le fichier donne les lettres des réponses, sans justification médicale détaillée. Cette grille est reproduite telle quelle et peut contenir des coquilles ; vérifiez avec votre référentiel à jour.",
        note,
      ].filter(Boolean).join("\n\n"),
      source: `Constantine — 17/10/2026 · Q. ${question.number} · p. ${question.page} · corrigé p. ${answerPage} · ${exam.sourceUrl}`,
    };
    const validation = validateQcm(input);
    if ("error" in validation) throw new Error(`Invalid reviewed question ${question.number}: ${validation.error}`);
    return { ...validation.data, sourceNumber: question.number, sourcePage: question.page };
  });
  return reviewed;
}
