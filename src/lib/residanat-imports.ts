import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { residanatDocumentImports, residanatQuestions } from "@/db/schema";
import { type SessionUser } from "@/lib/auth";
import { isSiteOwner } from "@/lib/residanat-access";
import { CONSTANTINE_DOCUMENT, reviewedConstantineQuestions } from "@/lib/residanat-document-data";

/** Idempotent, all-or-nothing import of the PDF explicitly supplied by the site owner. */
export async function importOwnerDocument(user: SessionUser): Promise<void> {
  if (!isSiteOwner(user)) throw new Error("Owner access required for document import");
  const source = CONSTANTINE_DOCUMENT;
  const existing = await db.select({ id: residanatDocumentImports.documentKey })
    .from(residanatDocumentImports)
    .where(and(eq(residanatDocumentImports.userId, user.id), eq(residanatDocumentImports.documentKey, source.id)))
    .limit(1);
  if (existing.length) return;
  const questions = reviewedConstantineQuestions();

  await db.transaction(async (tx) => {
    const marker = await tx.insert(residanatDocumentImports).values({
      userId: user.id, documentKey: source.id, title: source.title, sourceUrl: source.sourceUrl,
      sourceSha256: source.sourceSha256, questionCount: questions.length,
    }).onConflictDoNothing().returning({ id: residanatDocumentImports.documentKey });
    if (!marker.length) return;
    await tx.insert(residanatQuestions).values(questions.map((question) => ({
      userId: user.id, documentKey: source.id,
      specialty: question.specialty, prompt: question.prompt, options: question.options,
      correctOptionIds: question.correctOptionIds, explanation: question.explanation,
      source: question.source, sourceNumber: question.sourceNumber, sourcePage: question.sourcePage,
    })));
  });
}
