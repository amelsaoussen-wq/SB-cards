import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, pool } from "@/db";
import { users, sessions, authAttempts, residanatQuestions, residanatAttempts, residanatDocumentImports } from "@/db/schema";
import { OWNER_EMAIL } from "@/lib/owner";
import { validateQcm, type PracticeData } from "@/lib/residanat-model";
import a from "@/data/residanat/constantine-2021-03.json";
import b from "@/data/residanat/constantine-2022-02.json";
import c from "@/data/residanat/constantine-2022-12.json";
import d from "@/data/residanat/constantine-2023.json";
import native from "./fixtures/residanat-batch-keys.json";

const exams = [a, b, c, d];
const keys = native as Record<string, { sourceSha256: string; questionCount: number; answers: Record<string, string>; pages: Record<string, number> }>;
const base = "http://localhost:3000";
const token = randomBytes(32).toString("hex");
const cookie = `sb_session=${token}`;
const email = `batch-${randomUUID()}@example.test`;
const testAttempts: string[] = [];
let ownerId: string | undefined;
async function request(path: string, method = "GET", body?: unknown, auth = cookie) {
  return fetch(base + path, { method, redirect: "manual", headers: {
    ...(auth ? { Cookie: auth } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }),
  }, body: body === undefined ? undefined : JSON.stringify(body) });
}
async function main() {
  assert.equal(exams.length, 4);
  assert.equal(new Set(exams.map((exam) => exam.id)).size, 4);
  assert.equal(new Set(exams.map((exam) => exam.sourceSha256)).size, 4);
  assert.equal(exams.reduce((count, exam) => count + exam.questions.length, 0), 510);
  assert.equal(exams.reduce((count, exam) => count + exam.questions.flatMap((q) => q.options).length, 0), 2550);
  assert.ok(!/Neisserla|Listerla|Taenla|tibla/i.test(JSON.stringify(exams)), "Scientific names must not be altered by whitespace cleanup");
  for (const exam of exams) {
    const expected = keys[exam.id];
    assert.equal(exam.sourceSha256, expected.sourceSha256);
    assert.equal(exam.questionCount, expected.questionCount);
    assert.deepEqual(exam.questions.map((q) => q.number), Array.from({ length: exam.questionCount }, (_, i) => i + 1));
    for (const q of exam.questions) {
      assert.deepEqual(q.options.map((o) => o.id), ["A", "B", "C", "D", "E"]);
      assert.equal(q.correctOptionIds.join(""), expected.answers[String(q.number)]);
      assert.ok(!("error" in validateQcm({ ...q, source: exam.sourceUrl, explanation: "Corrigé fourni par le document d’origine." })), `${exam.id} Q${q.number}`);
      assert.equal(exam.answerSections.find((s) => s.first <= q.number && s.last >= q.number)?.page, expected.pages[String(q.number)]);
    }
  }
  console.log("PASS batch: 510 questions, 2550 options and all correction keys match independent native PDF text");
  assert.equal((await fetch(base + "/api/health")).status, 200);
  const [owner] = await db.select({ id: users.id }).from(users).where(process.env.OWNER_USER_ID
    ? eq(users.id, process.env.OWNER_USER_ID) : and(eq(users.email, OWNER_EMAIL), eq(users.isAdmin, true)));
  assert.ok(owner); ownerId = owner.id;
  await db.insert(sessions).values({ token, userId: ownerId, expiresAt: new Date(Date.now() + 3600000) });
  const previous = await db.select().from(residanatQuestions).where(and(eq(residanatQuestions.userId, ownerId), inArray(residanatQuestions.documentKey, ["constantine-2025-10-25", "constantine-2026-10-17"]))).orderBy(residanatQuestions.id);
  const previousAttempts = await db.select().from(residanatAttempts).where(eq(residanatAttempts.userId, ownerId)).orderBy(residanatAttempts.id);
  const responses = await Promise.all([request("/api/residanat"), request("/api/residanat"), request("/api/residanat")]);
  responses.forEach((r) => assert.equal(r.status, 200));
  const initial = await responses[0].json() as PracticeData;
  for (const exam of exams) {
    const receipt = initial.documents.find((doc) => doc.id === exam.id);
    assert.ok(receipt); assert.equal(receipt.questionCount, exam.questionCount); assert.equal(receipt.remainingCount, exam.questionCount);
    const [count] = await db.select({ n: sql<number>`count(*)::int` }).from(residanatDocumentImports).where(and(eq(residanatDocumentImports.userId, ownerId), eq(residanatDocumentImports.documentKey, exam.id)));
    assert.equal(count.n, 1);
    const stored: (typeof residanatQuestions.$inferSelect)[] = await db.select().from(residanatQuestions).where(and(eq(residanatQuestions.userId, ownerId), eq(residanatQuestions.documentKey, exam.id))).orderBy(residanatQuestions.sourceNumber);
    assert.equal(stored.length, exam.questionCount);
    for (const [i, row] of stored.entries()) {
      const q = exam.questions[i];
      assert.equal(row.prompt, q.prompt); assert.equal(row.specialty, q.specialty);
      assert.deepEqual(row.options, q.options); assert.deepEqual(row.correctOptionIds, q.correctOptionIds);
      assert.equal(row.sourceNumber, q.number); assert.equal(row.sourcePage, q.page);
      assert.ok(row.source.includes(exam.sourceUrl));
      assert.ok(row.explanation.includes(`page ${keys[exam.id].pages[String(q.number)]}`));
    }
    const filtered = await (await request(`/api/residanat?document=${exam.id}`)).json() as PracticeData;
    assert.equal(filtered.questions.length, exam.questionCount);
    assert.ok(filtered.questions.every((q) => q.documentKey === exam.id && !("correctOptionIds" in q) && !("explanation" in q)));
    const first = await (await request(`/api/residanat?document=${exam.id}&q=Q1`)).json() as PracticeData;
    assert.equal(first.questions.length, 1); assert.equal(first.questions[0].prompt, exam.questions[0].prompt);
  }
  const after = await db.select().from(residanatQuestions).where(and(eq(residanatQuestions.userId, ownerId), inArray(residanatQuestions.documentKey, ["constantine-2025-10-25", "constantine-2026-10-17"]))).orderBy(residanatQuestions.id);
  assert.deepEqual(after, previous);
  assert.deepEqual(await db.select().from(residanatAttempts).where(eq(residanatAttempts.userId, ownerId)).orderBy(residanatAttempts.id), previousAttempts);
  console.log("PASS batch: all four imports are complete and idempotent; 2025/2026 questions and prior results unchanged");

  for (const exam of exams) {
    const data = await (await request(`/api/residanat?document=${exam.id}`)).json() as PracticeData;
    const first = data.questions.find((q) => q.sourceNumber === 1)!;
    const last = data.questions.find((q) => q.sourceNumber === exam.questionCount)!;
    const correct = exam.questions[0].correctOptionIds;
    const wrong = correct.length > 1 ? [correct[0]] : ["ABCDE".split("").find((id) => !correct.includes(id))!];
    for (const [question, selection, isCorrect] of [[first, correct, true], [first, wrong, false], [last, exam.questions[exam.questionCount - 1].correctOptionIds, true]] as const) {
      const id = randomUUID(); testAttempts.push(id);
      const response = await request(`/api/residanat/${question.id}/answer`, "POST", { attemptId: id, version: question.version, selectedOptionIds: selection });
      assert.equal(response.status, 200);
      const result = await response.json(); assert.equal(result.feedback.isCorrect, isCorrect);
      assert.equal(result.feedback.correctOptionIds.join(""), keys[exam.id].answers[String(question.sourceNumber)]);
    }
  }
  const again = await (await request("/api/residanat")).json() as PracticeData;
  assert.equal(again.stats.correct, initial.stats.correct + 8); assert.equal(again.stats.incorrect, initial.stats.incorrect + 4);
  for (const exam of exams) assert.equal(again.documents.find((doc) => doc.id === exam.id)?.remainingCount, exam.questionCount);
  console.log("PASS batch: grading first/last questions uses the correct paper and keeps persistent counters");

  assert.equal((await request("/api/residanat", "GET", undefined, "")).status, 401);
  const registration = await fetch(base + "/api/auth/register", { method: "POST", redirect: "manual", body: new URLSearchParams({ name: "susan", email, password: randomBytes(18).toString("hex") }) });
  const normalCookie = registration.headers.get("set-cookie")?.match(/sb_session=[^;]+/)?.[0];
  assert.ok(normalCookie);
  for (const exam of exams) assert.equal((await request(`/api/residanat?document=${exam.id}`, "GET", undefined, normalCookie)).status, 403);
  const [normal] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  assert.equal((await db.select().from(residanatDocumentImports).where(eq(residanatDocumentImports.userId, normal.id))).length, 0);
  console.log("PASS batch: anonymous and other accounts cannot read or trigger these private imports");
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (ownerId && testAttempts.length) await db.delete(residanatAttempts).where(and(eq(residanatAttempts.userId, ownerId), inArray(residanatAttempts.id, testAttempts)));
  await db.delete(sessions).where(eq(sessions.token, token));
  await db.delete(authAttempts).where(eq(authAttempts.email, email));
  await db.delete(users).where(eq(users.email, email));
  await pool.end();
  console.log("Temporary test data removed; all source collections preserved.");
});
