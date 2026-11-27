import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { residanatQuestions } from "@/db/schema";
import { cleanLesson, inferResidanatLesson } from "@/lib/residanat-course-map";
import { QcmError } from "@/lib/residanat";

export async function moveQuestionLesson(userId: string, id: string, version: number, previousLesson: string, requestedLesson: string) {
  const [question] = await db.select().from(residanatQuestions)
    .where(and(eq(residanatQuestions.userId, userId), eq(residanatQuestions.id, id))).limit(1);
  if (!question) throw new QcmError("Question introuvable.", 404);
  if (question.version !== version) throw new QcmError("La question a été modifiée. Rechargez-la avant de changer son cours.", 409);
  const lesson = cleanLesson(requestedLesson) || inferResidanatLesson(question.specialty, question.prompt);
  if (question.lesson === lesson) return { id: question.id, lesson, version: question.version };
  if (question.lesson !== previousLesson) throw new QcmError("Le cours a été modifié dans une autre fenêtre. Rechargez la question.", 409);
  const [saved] = await db.update(residanatQuestions).set({ lesson })
    .where(and(eq(residanatQuestions.userId, userId), eq(residanatQuestions.id, id), eq(residanatQuestions.version, version), eq(residanatQuestions.lesson, previousLesson)))
    .returning({ id: residanatQuestions.id, lesson: residanatQuestions.lesson, version: residanatQuestions.version });
  if (!saved) throw new QcmError("La question vient de changer. Rechargez-la.", 409);
  // Classification alone does not change clinical revision, timestamps or previous corrections.
  return saved;
}
