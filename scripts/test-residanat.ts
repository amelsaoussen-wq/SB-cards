import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { users, sessions, residanatQuestions, authAttempts } from "@/db/schema";
import { OWNER_EMAIL } from "@/lib/owner";
import type { PracticeData, QcmInput } from "@/lib/residanat-model";

const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("This test writes temporary data and is restricted to localhost.");
let ownerId = process.env.OWNER_USER_ID;
const token = randomBytes(32).toString("hex");
const ownerCookie = `sb_session=${token}`;
const email = `qcm-test-${randomUUID()}@example.test`;
const password = randomBytes(18).toString("base64url");
const created: string[] = [];
let tests = 0;
function pass(label: string) { tests++; console.log(`PASS ${tests}: ${label}`); }
async function api(path: string, method = "GET", body?: unknown, cookie = ownerCookie) {
  return fetch(base + path, { method, redirect: "manual", headers: {
    ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }),
  }, body: body === undefined ? undefined : JSON.stringify(body) });
}
async function form(path: string, values: Record<string, string>) {
  return fetch(base + path, { method: "POST", redirect: "manual", body: new URLSearchParams(values) });
}

async function main() {
  const health = await fetch(base + "/api/health");
  assert.equal(health.status, 200);
  if (!ownerId) {
    const [configuredOwner] = await db.select({ id: users.id, isAdmin: users.isAdmin }).from(users).where(eq(users.email, OWNER_EMAIL));
    assert.ok(configuredOwner?.isAdmin, "The existing owner must have the database admin flag; this test never creates or promotes an owner.");
    ownerId = configuredOwner.id;
  }
  const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.id, ownerId!));
  assert.ok(owner, "Configured owner must exist; no owner is created by this test.");
  await db.insert(sessions).values({ token, userId: owner.id, expiresAt: new Date(Date.now() + 3600000) });

  assert.equal((await api("/api/residanat", "GET", undefined, "")).status, 401);
  pass("anonymous access denied (401)");
  const registration = await form("/api/auth/register", { name: "susan", email, password, clinic: "TEST ONLY" });
  assert.ok([303, 307].includes(registration.status));
  assert.ok(registration.headers.get("location")?.startsWith("/explore"));
  const ordinaryCookie = registration.headers.get("set-cookie")?.match(/sb_session=[^;]+/)?.[0];
  assert.ok(ordinaryCookie, "Registration must create a real session.");
  const [createdUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  assert.ok(createdUser);
  pass("real registration persisted a user and session");
  const wrongPassword = await form("/api/auth/login", { email, password: "not-the-password" });
  assert.ok(wrongPassword.headers.get("location")?.includes("error=bad"));
  const login = await form("/api/auth/login", { email, password });
  assert.equal(login.headers.get("location"), "/explore");
  const loginCookie = login.headers.get("set-cookie")?.match(/sb_session=[^;]+/)?.[0];
  assert.ok(loginCookie);
  pass("wrong-password rejection and correct-password login");

  assert.equal((await api("/api/residanat", "GET", undefined, ordinaryCookie)).status, 403);
  const normalDashboard = await fetch(base + "/dashboard", { headers: { Cookie: ordinaryCookie } });
  const normalHtml = await normalDashboard.text();
  assert.ok(!normalHtml.includes('href="/dashboard/residanat"'));
  pass("a user named susan does not receive owner privileges or navigation");

  const initialResponse = await api("/api/residanat");
  assert.equal(initialResponse.status, 200);
  const initial = await initialResponse.json() as PracticeData;
  assert.ok(initialResponse.headers.get("cache-control")?.includes("no-store"));
  assert.ok(initial.questions.every((q) => !("correctOptionIds" in q) && !("explanation" in q)));
  pass("owner practice data is private and unattempted answers are withheld");

  const payload: QcmInput = {
    specialty: "Cardiologie", prompt: `Question technique temporaire ${randomUUID()}`,
    options: ["A", "B", "C", "D"].map((id) => ({ id, text: `Proposition de test ${id}` })),
    correctOptionIds: ["A", "C"], explanation: "Corrigé de test : les propositions retenues sont A et C.", source: "Test technique — supprimé automatiquement",
  };
  assert.equal((await api("/api/residanat", "POST", payload, ordinaryCookie)).status, 403);
  assert.equal((await api("/api/residanat", "POST", { ...payload, correctOptionIds: [] })).status, 400);
  const newQuestion = await api("/api/residanat", "POST", payload);
  assert.equal(newQuestion.status, 201);
  const { id } = await newQuestion.json() as { id: string };
  created.push(id);
  const [saved] = await db.select().from(residanatQuestions).where(eq(residanatQuestions.id, id));
  assert.equal(saved.prompt, payload.prompt);
  assert.deepEqual(saved.correctOptionIds, ["A", "C"]);
  pass("valid question stored in PostgreSQL; invalid input rejected");

  for (const [path, method, body] of [
    [`/api/residanat/${id}`, "GET", undefined],
    [`/api/residanat/${id}`, "PUT", { ...payload, version: 1 }],
    [`/api/residanat/${id}`, "DELETE", undefined],
    [`/api/residanat/${id}/answer`, "POST", { version: 1, selectedOptionIds: ["A"], attemptId: randomUUID() }],
  ] as const) assert.equal((await api(path, method, body, ordinaryCookie)).status, 403);
  pass("all read/edit/delete/answer endpoints reject a non-owner");

  const filtered = await (await api(`/api/residanat?q=${encodeURIComponent(payload.prompt)}&specialty=Cardiologie`)).json() as PracticeData;
  assert.equal(filtered.questions.length, 1);
  assert.equal(filtered.questions[0].id, id);
  const empty = await (await api("/api/residanat?q=unlikely-empty-result-957390" )).json() as PracticeData;
  assert.equal(empty.questions.length, 0);
  pass("search, specialty filtering and empty results work");

  const attemptId = randomUUID();
  const wrongBody = { version: 1, selectedOptionIds: ["B"], attemptId };
  const wrong = await (await api(`/api/residanat/${id}/answer`, "POST", wrongBody)).json();
  assert.equal(wrong.feedback.isCorrect, false);
  assert.equal(wrong.stats.incorrect, initial.stats.incorrect + 1);
  assert.deepEqual(wrong.feedback.correctOptionIds, ["A", "C"]);
  const retry = await (await api(`/api/residanat/${id}/answer`, "POST", wrongBody)).json();
  assert.equal(retry.stats.incorrect, wrong.stats.incorrect);
  assert.equal((await api(`/api/residanat/${id}/answer`, "POST", { ...wrongBody, selectedOptionIds: ["A", "C"] })).status, 409);
  pass("wrong answer corrected by server; network retry cannot double-count");

  const correct = await (await api(`/api/residanat/${id}/answer`, "POST", { version: 1, selectedOptionIds: ["C", "A"], attemptId: randomUUID(), isCorrect: false })).json();
  assert.equal(correct.feedback.isCorrect, true);
  assert.equal(correct.stats.correct, initial.stats.correct + 1);
  const reloaded = await (await api(`/api/residanat?q=${encodeURIComponent(payload.prompt)}`)).json() as PracticeData;
  assert.equal(reloaded.questions[0].lastResult?.isCorrect, true);
  assert.equal((await api(`/api/residanat/${id}/answer`, "POST", { version: 1, selectedOptionIds: ["F"], attemptId: randomUUID() })).status, 400);
  pass("multi-answer grading ignores client flags and survives reload");

  const edited = { ...payload, prompt: payload.prompt + " — modifiée", version: 1, correctOptionIds: ["B"] };
  assert.equal((await api(`/api/residanat/${id}`, "PUT", edited)).status, 200);
  assert.equal((await api(`/api/residanat/${id}`, "PUT", edited)).status, 409);
  assert.equal((await api(`/api/residanat/${id}/answer`, "POST", { ...wrongBody, attemptId: randomUUID() })).status, 409);
  const editView = await (await api(`/api/residanat/${id}`)).json();
  assert.equal(editView.version, 2);
  assert.deepEqual(editView.correctOptionIds, ["B"]);
  const view = await (await api(`/api/residanat?q=${encodeURIComponent(payload.prompt)}`)).json() as PracticeData;
  assert.equal(view.questions[0].lastResult, null);
  const newAttempt = await (await api(`/api/residanat/${id}/answer`, "POST", { version: 2, selectedOptionIds: ["B"], attemptId: randomUUID() })).json();
  assert.equal(newAttempt.feedback.isCorrect, true);
  pass("editing persists, old versions are rejected, updated key is graded");

  assert.equal((await api(`/api/residanat/${id}`, "DELETE")).status, 200);
  assert.equal((await api(`/api/residanat/${id}`)).status, 404);
  assert.equal((await db.select().from(residanatQuestions).where(eq(residanatQuestions.id, id))).length, 0);
  const final = await (await api("/api/residanat")).json() as PracticeData;
  assert.deepEqual(final.stats, initial.stats);
  pass("deletion persists and removes associated attempts without altering existing scores");

  const logout = await fetch(base + "/api/auth/logout", { method: "POST", redirect: "manual", headers: { Cookie: loginCookie } });
  assert.ok([303, 307].includes(logout.status));
  const invalid = await api("/api/residanat", "GET", undefined, loginCookie);
  assert.equal(invalid.status, 401);
  pass("logout invalidates the database session");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  for (const id of created) await db.delete(residanatQuestions).where(and(eq(residanatQuestions.id, id), eq(residanatQuestions.userId, ownerId!)));
  await db.delete(sessions).where(eq(sessions.token, token));
  await db.delete(authAttempts).where(eq(authAttempts.email, email));
  await db.delete(users).where(eq(users.email, email));
  await pool.end();
  console.log("Temporary test records removed; existing accounts and cards preserved.");
});
