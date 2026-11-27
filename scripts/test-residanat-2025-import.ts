import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, pool } from "@/db";
import { users, sessions, authAttempts, residanatQuestions, residanatAttempts, residanatDocumentImports } from "@/db/schema";
import { OWNER_EMAIL } from "@/lib/owner";
import { validateQcm, type PracticeData } from "@/lib/residanat-model";
import exam from "@/data/residanat/constantine-2025.json";
import previousExam from "@/data/residanat/constantine-2026.json";

const base = "http://localhost:3000";
const token = randomBytes(32).toString("hex");
const cookie = `sb_session=${token}`;
const attempts: string[] = [];
const email = `pdf2025-test-${randomUUID()}@example.test`;
let ownerId: string | undefined;
async function request(path: string, method = "GET", body?: unknown, auth = cookie) {
  return fetch(base + path, { method, redirect: "manual", headers: {
    ...(auth ? { Cookie: auth } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }),
  }, body: body === undefined ? undefined : JSON.stringify(body) });
}

async function main() {
  assert.equal(exam.questions.length, 150);
  assert.equal(exam.questions.flatMap((q) => q.options).length, 750);
  assert.deepEqual(exam.questions.map((q) => q.number), Array.from({ length: 150 }, (_, i) => i + 1));
  assert.equal(exam.sourceSha256, "0cf804dcaf8e492cee7b462ffa05b7ab91169be43391fbeb3dd8b62b7ef2bf13");
  assert.notEqual(exam.id, previousExam.id);
  assert.notEqual(exam.sourceSha256, previousExam.sourceSha256);
  for (const q of exam.questions) {
    assert.deepEqual(q.options.map((o) => o.id), ["A", "B", "C", "D", "E"]);
    assert.ok(!("error" in validateQcm({ ...q, source: exam.sourceUrl, explanation: "Grille du corrigé type fournie avec ce document." })), `Invalid question ${q.number}`);
  }
  assert.ok(exam.questions[13].options[0].text.includes("HCO₃⁻"));
  assert.ok(exam.questions[16].options[0].text.includes("α1"));
  assert.ok(exam.questions[63].prompt.includes("3,2 g/l"));
  assert.equal(exam.questions[149].page, 20);
  assert.deepEqual(exam.questions[0].correctOptionIds, ["C", "D"]);
  assert.deepEqual(exam.questions[149].correctOptionIds, ["B", "E"]);
  console.log("PASS 2025: 150 questions, 750 choices, full key and important symbols validated");

  assert.equal((await fetch(base + "/api/health")).status, 200);
  const [owner] = await db.select({ id: users.id }).from(users).where(process.env.OWNER_USER_ID
    ? eq(users.id, process.env.OWNER_USER_ID) : and(eq(users.email, OWNER_EMAIL), eq(users.isAdmin, true)));
  assert.ok(owner); ownerId = owner.id;
  await db.insert(sessions).values({ token, userId: ownerId, expiresAt: new Date(Date.now() + 3600000) });

  const previousRows = await db.select().from(residanatQuestions)
    .where(and(eq(residanatQuestions.userId, ownerId), eq(residanatQuestions.documentKey, previousExam.id)))
    .orderBy(residanatQuestions.id);
  const previousAttempts = await db.select().from(residanatAttempts).where(eq(residanatAttempts.userId, ownerId)).orderBy(residanatAttempts.id);
  const responses = await Promise.all([request("/api/residanat"), request("/api/residanat"), request("/api/residanat")]);
  for (const response of responses) assert.equal(response.status, 200);
  const data = await responses[0].json() as PracticeData;
  const receipt = data.documents.find((d) => d.id === exam.id);
  assert.ok(receipt);
  assert.equal(receipt.questionCount, 150);
  assert.equal(receipt.remainingCount, 150);
  assert.ok(data.documents.some((d) => d.id === previousExam.id));
  const [count] = await db.select({ n: sql<number>`count(*)::int` }).from(residanatDocumentImports)
    .where(and(eq(residanatDocumentImports.userId, ownerId), eq(residanatDocumentImports.documentKey, exam.id)));
  assert.equal(count.n, 1);
  const stored = await db.select().from(residanatQuestions)
    .where(and(eq(residanatQuestions.userId, ownerId), eq(residanatQuestions.documentKey, exam.id)))
    .orderBy(residanatQuestions.sourceNumber);
  assert.equal(stored.length, 150);
  for (const [i, row] of stored.entries()) {
    const q = exam.questions[i];
    assert.equal(row.sourceNumber, q.number);
    assert.equal(row.sourcePage, q.page);
    assert.equal(row.prompt, q.prompt);
    assert.equal(row.specialty, q.specialty);
    assert.deepEqual(row.options, q.options);
    assert.deepEqual(row.correctOptionIds, q.correctOptionIds);
    assert.ok(row.source.includes("25/10/2025"));
    assert.ok(row.source.includes(exam.sourceUrl));
    assert.ok(row.explanation.includes(`page ${q.number <= 100 ? 21 : 22}`));
    assert.ok(row.explanation.includes("sans justification médicale détaillée"));
  }
  const afterPrevious = await db.select().from(residanatQuestions)
    .where(and(eq(residanatQuestions.userId, ownerId), eq(residanatQuestions.documentKey, previousExam.id)))
    .orderBy(residanatQuestions.id);
  if (previousRows.length) assert.deepEqual(afterPrevious, previousRows);
  assert.deepEqual(await db.select().from(residanatAttempts).where(eq(residanatAttempts.userId, ownerId)).orderBy(residanatAttempts.id), previousAttempts);
  console.log("PASS 2025: exact stored content, one import receipt, 2026 records and existing attempts unchanged");

  const filtered = await (await request(`/api/residanat?document=${exam.id}`)).json() as PracticeData;
  assert.equal(filtered.questions.length, 150);
  assert.ok(filtered.questions.every((q) => q.documentKey === exam.id && !("correctOptionIds" in q) && !("explanation" in q)));
  const anatomy = await (await request(`/api/residanat?document=${exam.id}&specialty=${encodeURIComponent("Anatomie pathologique")}`)).json() as PracticeData;
  assert.equal(anatomy.questions.length, 13);
  const one = await (await request(`/api/residanat?document=${exam.id}&q=Q1`)).json() as PracticeData;
  assert.equal(one.questions.length, 1);
  assert.equal(one.questions[0].prompt, exam.questions[0].prompt);
  const oldOne = await (await request(`/api/residanat?document=${previousExam.id}&q=Q1`)).json() as PracticeData;
  assert.equal(oldOne.questions[0].prompt, previousExam.questions[0].prompt);
  assert.notEqual(one.questions[0].id, oldOne.questions[0].id);
  console.log("PASS 2025: document/specialty/number filters separate both years and hide unattempted corrections");

  for (const [index, choices, correct] of [[0, ["C", "D"], true], [0, ["C"], false], [149, ["B", "E"], true]] as const) {
    const row = stored[index]; const attemptId = randomUUID(); attempts.push(attemptId);
    const response = await request(`/api/residanat/${row.id}/answer`, "POST", { version: row.version, selectedOptionIds: [...choices], attemptId });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.feedback.isCorrect, correct);
    assert.deepEqual(result.feedback.correctOptionIds, exam.questions[index].correctOptionIds);
  }
  const last = await (await request(`/api/residanat?document=${exam.id}&q=Q150`)).json() as PracticeData;
  assert.equal(last.questions[0].lastResult?.isCorrect, true);
  assert.equal(last.stats.correct, data.stats.correct + 2);
  assert.equal(last.stats.incorrect, data.stats.incorrect + 1);
  const again = await (await request(`/api/residanat?document=${exam.id}`)).json() as PracticeData;
  assert.equal(again.questions.length, 150);
  console.log("PASS 2025: first and last keys grade accurately; results persist without duplicate questions");

  assert.equal((await request(`/api/residanat?document=${exam.id}`, "GET", undefined, "")).status, 401);
  const registration = await fetch(base + "/api/auth/register", { method: "POST", redirect: "manual", body: new URLSearchParams({ name: "susan", email, password: randomBytes(18).toString("hex") }) });
  const normalCookie = registration.headers.get("set-cookie")?.match(/sb_session=[^;]+/)?.[0];
  assert.ok(normalCookie);
  assert.equal((await request(`/api/residanat?document=${exam.id}`, "GET", undefined, normalCookie)).status, 403);
  const [normal] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  assert.equal((await db.select().from(residanatDocumentImports).where(eq(residanatDocumentImports.userId, normal.id))).length, 0);
  console.log("PASS 2025: anonymous and non-owner accounts cannot access or import the document");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (ownerId && attempts.length) await db.delete(residanatAttempts).where(and(eq(residanatAttempts.userId, ownerId), inArray(residanatAttempts.id, attempts)));
  await db.delete(sessions).where(eq(sessions.token, token));
  await db.delete(authAttempts).where(eq(authAttempts.email, email));
  await db.delete(users).where(eq(users.email, email));
  await pool.end();
  console.log("Temporary test data removed; both source collections and all previous data preserved.");
});
