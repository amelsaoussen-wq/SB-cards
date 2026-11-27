import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { residanatDocumentImports, residanatQuestions } from "@/db/schema";
import { type SessionUser } from "@/lib/auth";
import { isSiteOwner } from "@/lib/residanat-access";
import { ensureQuestionLessons } from "@/lib/residanat-lessons";
import { inferResidanatLesson } from "@/lib/residanat-course-map";
import { REVIEWED_DOCUMENTS, reviewedDocumentQuestions } from "@/lib/residanat-document-data";

/** Import only reviewed documents requested by the owner; each collection is atomic and idempotent. */
export async function importOwnerDocument(user: SessionUser): Promise<void> {
  if (!isSiteOwner(user)) throw new Error("Owner access required for document import");

  for (const source of REVIEWED_DOCUMENTS) {
    const existing = await db.select({ id: residanatDocumentImports.documentKey })
      .from(residanatDocumentImports)
      .where(and(eq(residanatDocumentImports.userId, user.id), eq(residanatDocumentImports.documentKey, source.id)))
      .limit(1);
    // Never overwrite an existing collection, its edits, deletions or attempts.
    if (existing.length) continue;
    const questions = reviewedDocumentQuestions(source.id);

    await db.transaction(async (tx) => {
      const marker = await tx.insert(residanatDocumentImports).values({
        userId: user.id, documentKey: source.id, title: source.title, sourceUrl: source.sourceUrl,
        sourceSha256: source.sourceSha256, questionCount: questions.length,
      }).onConflictDoNothing().returning({ id: residanatDocumentImports.documentKey });
      if (!marker.length) return;
      await tx.insert(residanatQuestions).values(questions.map((question) => ({
        userId: user.id, documentKey: source.id,
        specialty: question.specialty, lesson: question.lesson ?? inferResidanatLesson(question.specialty, question.prompt), prompt: question.prompt, options: question.options,
        correctOptionIds: question.correctOptionIds, explanation: question.explanation,
        source: question.source, sourceNumber: question.sourceNumber, sourcePage: question.sourcePage,
      })));
    });
  }
  await ensureQuestionLessons(user.id);
}
