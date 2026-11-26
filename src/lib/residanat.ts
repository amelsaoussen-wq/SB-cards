import "server-only";

import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { residanatAttempts, residanatQuestions, residanatSampleImports } from "@/db/schema";
import { RESIDANAT_SAMPLES } from "@/lib/residanat-samples";
import { gradeSelection, type PracticeData, type PracticeStats, type QcmFeedback, type QcmInput } from "@/lib/residanat-model";

export class QcmError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function seedResidanatExamples(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const marker = await tx.insert(residanatSampleImports).values({ userId }).onConflictDoNothing().returning();
    if (!marker.length) return;
    await tx.insert(residanatQuestions).values(RESIDANAT_SAMPLES.map((question) => ({ ...question, userId })));
  });
}

export async function getPracticeStats(userId: string): Promise<PracticeStats> {
  const [[total], [scores]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(residanatQuestions).where(eq(residanatQuestions.userId, userId)),
    db.select({
      correct: sql<number>`count(*) filter (where ${residanatAttempts.isCorrect})::int`,
      incorrect: sql<number>`count(*) filter (where not ${residanatAttempts.isCorrect})::int`,
    }).from(residanatAttempts).where(eq(residanatAttempts.userId, userId)),
  ]);
  return { total: total?.count ?? 0, correct: scores?.correct ?? 0, incorrect: scores?.incorrect ?? 0 };
}

export async function getPracticeData(userId: string, filters: { q?: string; specialty?: string } = {}): Promise<PracticeData> {
  const conditions = [eq(residanatQuestions.userId, userId)];
  if (filters.specialty) conditions.push(eq(residanatQuestions.specialty, filters.specialty));
  if (filters.q?.trim()) {
    // Literal substring search; percent and underscore are not wildcards supplied by users.
    const text = filters.q.trim().slice(0, 160).replace(/[\\%_]/g, "\\$&");
    conditions.push(ilike(residanatQuestions.prompt, `%${text}%`));
  }
  const [rows, specialties, stats] = await Promise.all([
    db.select({
      id: residanatQuestions.id,
      specialty: residanatQuestions.specialty,
      prompt: residanatQuestions.prompt,
      options: residanatQuestions.options,
      multiple: sql<boolean>`jsonb_array_length(${residanatQuestions.correctOptionIds}) > 1`,
      source: residanatQuestions.source,
      version: residanatQuestions.version,
      lastResult: sql<QcmFeedback | null>`(
        select a.feedback from residanat_attempts a
        where a.user_id = ${userId} and a.question_id = "residanat_questions"."id"
          and a.question_version = "residanat_questions"."version"
        order by a.created_at desc, a.id desc limit 1
      )`.mapWith(residanatAttempts.feedback),
    }).from(residanatQuestions).where(and(...conditions))
      .orderBy(residanatQuestions.specialty, desc(residanatQuestions.createdAt)),
    db.select({ name: residanatQuestions.specialty, count: sql<number>`count(*)::int` })
      .from(residanatQuestions).where(eq(residanatQuestions.userId, userId))
      .groupBy(residanatQuestions.specialty).orderBy(residanatQuestions.specialty),
    getPracticeStats(userId),
  ]);
  return { questions: rows, specialties, stats };
}

export async function getEditableQuestion(userId: string, id: string) {
  const [row] = await db.select().from(residanatQuestions)
    .where(and(eq(residanatQuestions.userId, userId), eq(residanatQuestions.id, id))).limit(1);
  if (!row) throw new QcmError("Cette question n’existe plus.", 404);
  return { id: row.id, specialty: row.specialty, prompt: row.prompt, options: row.options,
    correctOptionIds: row.correctOptionIds, explanation: row.explanation, source: row.source, version: row.version };
}

export async function saveQuestion(userId: string, input: QcmInput, id?: string): Promise<string> {
  const { version, ...data } = input;
  if (!id) {
    const [row] = await db.insert(residanatQuestions).values({ ...data, userId }).returning({ id: residanatQuestions.id });
    return row.id;
  }
  if (!Number.isInteger(version) || !version || version < 1) throw new QcmError("La version de la question est requise.", 400);
  const [row] = await db.update(residanatQuestions).set({ ...data, updatedAt: new Date(), version: version + 1 })
    .where(and(eq(residanatQuestions.id, id), eq(residanatQuestions.userId, userId), eq(residanatQuestions.version, version)))
    .returning({ id: residanatQuestions.id });
  if (!row) throw new QcmError("La question a changé ou a été supprimée. Fermez l’éditeur et rechargez la liste.", 409);
  return row.id;
}

export async function removeQuestion(userId: string, id: string): Promise<void> {
  const removed = await db.delete(residanatQuestions)
    .where(and(eq(residanatQuestions.id, id), eq(residanatQuestions.userId, userId)))
    .returning({ id: residanatQuestions.id });
  if (!removed.length) throw new QcmError("Cette question n’existe plus.", 404);
}

export async function submitAnswer(userId: string, questionId: string, attemptId: string, version: number, selection: string[]) {
  const feedback = await db.transaction(async (tx) => {
    // The client reuses this id when retrying a network request. Only one attempt is recorded.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${attemptId}, 0))`);
    const [already] = await tx.select().from(residanatAttempts).where(eq(residanatAttempts.id, attemptId)).limit(1);
    if (already) {
      if (already.userId !== userId || already.questionId !== questionId || already.questionVersion !== version || !gradeSelection(already.selectedOptionIds, selection)) {
        throw new QcmError("Cette tentative a déjà été utilisée.", 409);
      }
      return already.feedback;
    }
    const [question] = await tx.select().from(residanatQuestions)
      .where(and(eq(residanatQuestions.id, questionId), eq(residanatQuestions.userId, userId))).for("share");
    if (!question) throw new QcmError("Question introuvable.", 404);
    if (question.version !== version) throw new QcmError("Cette question a été modifiée. Rechargez-la avant de répondre.", 409);
    if (!selection.length || new Set(selection).size !== selection.length || selection.some((id) => !question.options.some((option) => option.id === id))) {
      throw new QcmError("Sélectionnez au moins une proposition valide.", 400);
    }
    if (question.correctOptionIds.length === 1 && selection.length > 1) throw new QcmError("Cette question attend une seule réponse.", 400);
    const result: QcmFeedback = {
      isCorrect: gradeSelection(selection, question.correctOptionIds),
      selectedOptionIds: [...selection].sort(),
      correctOptionIds: question.correctOptionIds,
      explanation: question.explanation,
    };
    await tx.insert(residanatAttempts).values({ id: attemptId, userId, questionId, questionVersion: version,
      selectedOptionIds: result.selectedOptionIds, isCorrect: result.isCorrect, feedback: result });
    return result;
  });
  return { feedback, stats: await getPracticeStats(userId) };
}
