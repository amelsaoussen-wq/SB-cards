import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { residanatQuestions } from "@/db/schema";
import { inferResidanatLesson } from "@/lib/residanat-course-map";

/** Metadata-only backfill: never changes the question, answer key, version, timestamps or attempts. */
export async function ensureQuestionLessons(userId: string): Promise<void> {
  const pending = await db.select({ id: residanatQuestions.id, specialty: residanatQuestions.specialty, prompt: residanatQuestions.prompt })
    .from(residanatQuestions).where(and(eq(residanatQuestions.userId, userId), eq(residanatQuestions.lesson, "")));
  for (let offset = 0; offset < pending.length; offset += 250) {
    const batch = pending.slice(offset, offset + 250);
    const cases = batch.map((question) => sql`when ${question.id} then ${inferResidanatLesson(question.specialty, question.prompt)}`);
    await db.update(residanatQuestions).set({
      lesson: sql`case ${residanatQuestions.id} ${sql.join(cases, sql` `)} else ${residanatQuestions.lesson} end`,
    }).where(and(
      eq(residanatQuestions.userId, userId),
      eq(residanatQuestions.lesson, ""),
      inArray(residanatQuestions.id, batch.map((question) => question.id)),
    ));
  }
}
