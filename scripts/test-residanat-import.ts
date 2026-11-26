import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, pool } from "@/db";
import { users, sessions, authAttempts, residanatQuestions, residanatAttempts, residanatDocumentImports } from "@/db/schema";
import { OWNER_EMAIL } from "@/lib/owner";
import { validateQcm, type PracticeData } from "@/lib/residanat-model";
import exam from "@/data/residanat/constantine-2026.json";

const base = "http://localhost:3000";
const token = randomBytes(32).toString("hex");
const cookie = `sb_session=${token}`;
const attemptIds: string[] = [];
const email = `pdf-import-test-${randomUUID()}@example.test`;
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
  assert.equal(exam.sourceSha256, "9e0414154bdb37845153557317f22df4d45ab9ac967d58d490e331284a495fb3");
  for (const q of exam.questions) {
    assert.deepEqual(q.options.map((o) => o.id), ["A", "B", "C", "D", "E"]);
    assert.ok(!("error" in validateQcm({ ...q, source: exam.sourceUrl, explanation: "Corrigé type fourni dans le document." })), `Invalid question ${q.number}`);
  }
  assert.deepEqual(exam.questions[94].correctOptionIds, ["A", "B", "C", "D"]);
  assert.ok(exam.questions[94].prompt.includes("ostéoporose"));
  assert.ok(exam.questions[126].prompt.includes("30 ans"));
  assert.ok(exam.questions[83].options[0].text.includes("≥"));
  console.log("PASS import: 150 sequential questions, 750 choices, all keys and metadata validated");

  assert.equal((await fetch(base + "/api/health")).status, 200);
  const ownerRows = await db.select({ id: users.id }).from(users).where(process.env.OWNER_USER_ID
    ? eq(users.id, process.env.OWNER_USER_ID) : and(eq(users.email, OWNER_EMAIL), eq(users.isAdmin, true)));
  ownerId = ownerRows[0]?.id;
  assert.ok(ownerId);
  await db.insert(sessions).values({ token, userId: ownerId, expiresAt: new Date(Date.now() + 3600000) });

  const responses = await Promise.all([request("/api/residanat"), request("/api/residanat"), request("/api/residanat")]);
  for (const response of responses) assert.equal(response.status, 200);
  const initial = await responses[0].json() as PracticeData;
  const collection = initial.documents.find((d) => d.id === exam.id);
  assert.ok(collection);
  assert.equal(collection.questionCount, 150);
  assert.equal(collection.remainingCount, 150);
  const [receipt] = await db.select({ count: sql<number>`count(*)::int` }).from(residanatDocumentImports)
    .where(and(eq(residanatDocumentImports.userId, ownerId), eq(residanatDocumentImports.documentKey, exam.id)));
  assert.equal(receipt.count, 1);
  const stored = await db.select().from(residanatQuestions)
    .where(and(eq(residanatQuestions.userId, ownerId), eq(residanatQuestions.documentKey, exam.id)))
    .orderBy(residanatQuestions.sourceNumber);
  assert.equal(stored.length, 150);
  for (const [index, row] of stored.entries()) {
    const source = exam.questions[index];
    assert.equal(row.sourceNumber, source.number);
    assert.equal(row.sourcePage, source.page);
    assert.equal(row.prompt, source.prompt);
    assert.deepEqual(row.options, source.options);
    assert.deepEqual(row.correctOptionIds, source.correctOptionIds);
    assert.ok(row.explanation.includes("sans justification médicale détaillée"));
  }
  console.log("PASS import: all 150 stored questions and keys exactly match the reviewed source; concurrent requests create one import only");

  const filtered = await (await request(`/api/residanat?document=${exam.id}`)).json() as PracticeData;
  assert.equal(filtered.questions.length, 150);
  assert.ok(filtered.questions.every((q) => q.documentKey === exam.id && !("correctOptionIds" in q) && !("explanation" in q)));
  const specialty = await (await request(`/api/residanat?document=${exam.id}&specialty=${encodeURIComponent("Anatomie pathologique")}`)).json() as PracticeData;
  assert.equal(specialty.questions.length, 14);
  const numbered = await (await request(`/api/residanat?document=${exam.id}&q=Q95`)).json() as PracticeData;
  assert.equal(numbered.questions.length, 1);
  assert.equal(numbered.questions[0].sourceNumber, 95);
  console.log("PASS import: document/specialty/number filters work and raw correction keys stay private");

  for (const [index, choices, correct] of [[0, ["B", "D"], true], [0, ["B"], false], [149, ["A", "C", "D"], true]] as const) {
    const row = stored[index];
    const attemptId = randomUUID(); attemptIds.push(attemptId);
    const response = await request(`/api/residanat/${row.id}/answer`, "POST", { version: row.version, selectedOptionIds: [...choices], attemptId });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.feedback.isCorrect, correct);
    assert.deepEqual(result.feedback.correctOptionIds, exam.questions[index].correctOptionIds);
  }
  const last = await (await request(`/api/residanat?document=${exam.id}&q=Q150`)).json() as PracticeData;
  assert.equal(last.questions[0].lastResult?.isCorrect, true);
  const repeated = await (await request(`/api/residanat?document=${exam.id}`)).json() as PracticeData;
  assert.equal(repeated.questions.length, 150);
  assert.equal(repeated.stats.correct, initial.stats.correct + 2);
  assert.equal(repeated.stats.incorrect, initial.stats.incorrect + 1);
  console.log("PASS import: first/last source answers graded correctly and retained after reload");

  assert.equal((await request(`/api/residanat?document=${exam.id}`, "GET", undefined, "")).status, 401);
  const register = await fetch(base + "/api/auth/register", { method: "POST", redirect: "manual", body: new URLSearchParams({ name: "susan", email, password: randomBytes(20).toString("hex") }) });
  const ordinaryCookie = register.headers.get("set-cookie")?.match(/sb_session=[^;]+/)?.[0];
  assert.ok(ordinaryCookie);
  assert.equal((await request(`/api/residanat?document=${exam.id}`, "GET", undefined, ordinaryCookie)).status, 403);
  const [normal] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  const normalImports = await db.select().from(residanatDocumentImports).where(eq(residanatDocumentImports.userId, normal.id));
  assert.equal(normalImports.length, 0);
  console.log("PASS import: anonymous and ordinary accounts cannot read or trigger the owner's import");
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (ownerId && attemptIds.length) await db.delete(residanatAttempts).where(and(eq(residanatAttempts.userId, ownerId), inArray(residanatAttempts.id, attemptIds)));
  await db.delete(sessions).where(eq(sessions.token, token));
  await db.delete(authAttempts).where(eq(authAttempts.email, email));
  await db.delete(users).where(eq(users.email, email));
  await pool.end();
  console.log("Test sessions/attempts removed; imported document and existing data preserved.");
});
