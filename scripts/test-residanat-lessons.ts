import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db, pool } from "@/db";
import { users, sessions, authAttempts, residanatQuestions, residanatAttempts } from "@/db/schema";
import { OWNER_EMAIL } from "@/lib/owner";
import { inferResidanatLesson } from "@/lib/residanat-course-map";
import { resolvePracticeView, EMPTY_PRACTICE_FILTERS, type PracticeData, type QcmInput } from "@/lib/residanat-model";

const base = "http://localhost:3000";
const token = randomBytes(32).toString("hex");
const cookie = `sb_session=${token}`;
const email = `lessons-test-${randomUUID()}@example.test`;
const created: string[] = [];
let ownerId: string | undefined;
const stableColumns = {
  id: residanatQuestions.id, prompt: residanatQuestions.prompt, options: residanatQuestions.options,
  correctOptionIds: residanatQuestions.correctOptionIds, explanation: residanatQuestions.explanation,
  specialty: residanatQuestions.specialty, source: residanatQuestions.source, version: residanatQuestions.version,
  documentKey: residanatQuestions.documentKey, sourceNumber: residanatQuestions.sourceNumber,
  sourcePage: residanatQuestions.sourcePage, createdAt: residanatQuestions.createdAt, updatedAt: residanatQuestions.updatedAt,
};
async function request(path: string, method = "GET", body?: unknown, auth = cookie) {
  return fetch(base + path, { method, redirect: "manual", headers: {
    ...(auth ? { Cookie: auth } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }),
  }, body: body === undefined ? undefined : JSON.stringify(body) });
}
async function data(query = ""): Promise<PracticeData> {
  const response = await request(`/api/residanat${query}`); assert.equal(response.status, 200);
  return response.json() as Promise<PracticeData>;
}
async function main() {
  assert.equal(inferResidanatLesson("Cardiologie", "Le roulement d’Austin Flint est présent dans :"), "Valvulopathies");
  assert.equal(inferResidanatLesson("Pédiatrie", "Le rachitisme carentiel du nourrisson"), "Rachitisme");
  assert.equal(inferResidanatLesson("Anatomie pathologique", "Les ostéomes :"), "Tumeurs et cancérogenèse");
  assert.equal(resolvePracticeView(EMPTY_PRACTICE_FILTERS), "specialties");
  assert.equal(resolvePracticeView({ ...EMPTY_PRACTICE_FILTERS, specialty: "Cardiologie" }), "lessons");
  assert.equal(resolvePracticeView({ ...EMPTY_PRACTICE_FILTERS, specialty: "Cardiologie", lesson: "Valvulopathies" }), "questions");
  console.log("PASS lessons: deterministic topic labels and specialty → lesson → QCM state");

  assert.equal((await fetch(base + "/api/health")).status, 200);
  const [owner] = await db.select({ id: users.id }).from(users).where(process.env.OWNER_USER_ID
    ? eq(users.id, process.env.OWNER_USER_ID) : and(eq(users.email, OWNER_EMAIL), eq(users.isAdmin, true)));
  assert.ok(owner); ownerId = owner.id;
  await db.insert(sessions).values({ token, userId: ownerId, expiresAt: new Date(Date.now() + 3600000) });
  const before = await db.select(stableColumns).from(residanatQuestions).where(eq(residanatQuestions.userId, ownerId)).orderBy(residanatQuestions.id);
  const attemptsBefore = await db.select().from(residanatAttempts).where(eq(residanatAttempts.userId, ownerId)).orderBy(residanatAttempts.id);
  const initial = await data();
  assert.ok(initial.questions.every((question) => question.lesson.trim().length > 0));
  assert.equal(initial.specialties.reduce((sum, item) => sum + item.count, 0), initial.stats.total);
  assert.ok(initial.specialties.every((item) => item.lessonCount > 0));
  const after = before.length ? await db.select(stableColumns).from(residanatQuestions).where(inArray(residanatQuestions.id, before.map((q) => q.id))).orderBy(residanatQuestions.id) : [];
  assert.deepEqual(after, before);
  assert.deepEqual(await db.select().from(residanatAttempts).where(eq(residanatAttempts.userId, ownerId)).orderBy(residanatAttempts.id), attemptsBefore);
  console.log("PASS lessons: existing questions classified without altering content, keys, revisions, timestamps or attempts");

  const cardiology = await data("?specialty=Cardiologie");
  assert.ok(cardiology.lessons.length > 1);
  assert.ok(cardiology.lessons.some((item) => item.name === "Valvulopathies"));
  assert.equal(cardiology.lessons.reduce((sum, item) => sum + item.count, 0), cardiology.questions.length);
  const lessonQuery = `?specialty=Cardiologie&lesson=${encodeURIComponent("Valvulopathies")}`;
  const valve = await data(lessonQuery);
  assert.ok(valve.questions.length > 0);
  assert.ok(valve.questions.every((question) => question.specialty === "Cardiologie" && question.lesson === "Valvulopathies"));
  assert.equal(valve.questions.length, cardiology.lessons.find((item) => item.name === "Valvulopathies")?.count);
  const byDocument = await data(lessonQuery + "&document=constantine-2025-10-25");
  assert.ok(byDocument.questions.every((question) => question.documentKey === "constantine-2025-10-25"));
  assert.equal((await data("?specialty=Cardiologie&lesson=absent-course-728315")).questions.length, 0);
  console.log("PASS lessons: specialty/course/document filters and real counts agree");

  const payload: QcmInput = { specialty: "Cardiologie", lesson: " Cours personnel de test ", prompt: `Question technique de classement ${randomUUID()}`,
    options: [{ id: "A", text: "Proposition retenue" }, { id: "B", text: "Autre proposition" }], correctOptionIds: ["A"],
    explanation: "Explication temporaire pour le test technique.", source: "Test temporaire" };
  assert.equal((await request("/api/residanat", "POST", { ...payload, lesson: "x".repeat(121) })).status, 400);
  const create = await request("/api/residanat", "POST", payload); assert.equal(create.status, 201);
  const { id } = await create.json() as { id: string }; created.push(id);
  const saved = await (await request(`/api/residanat/${id}`)).json();
  assert.equal(saved.lesson, "Cours personnel de test");
  const answered = await request(`/api/residanat/${id}/answer`, "POST", { attemptId: randomUUID(), version: saved.version, selectedOptionIds: ["A"] });
  assert.equal(answered.status, 200); assert.equal((await answered.json()).feedback.isCorrect, true);
  const move = { lesson: "Mon cours déplacé", previousLesson: saved.lesson, version: saved.version };
  assert.equal((await request(`/api/residanat/${id}`, "PATCH", move)).status, 200);
  assert.equal((await request(`/api/residanat/${id}`, "PATCH", move)).status, 200);
  assert.equal((await request(`/api/residanat/${id}`, "PATCH", { ...move, lesson: "Autre destination" })).status, 409);
  const moved = await (await request(`/api/residanat/${id}`)).json();
  assert.equal(moved.lesson, "Mon cours déplacé"); assert.equal(moved.version, saved.version);
  const movedData = await data(`?specialty=Cardiologie&lesson=${encodeURIComponent(moved.lesson)}`);
  assert.equal(movedData.questions.find((q) => q.id === id)?.lastResult?.isCorrect, true);
  await data();
  assert.equal((await (await request(`/api/residanat/${id}`)).json()).lesson, "Mon cours déplacé");
  console.log("PASS lessons: custom course moves persist and keep the previous correct answer");

  const registration = await fetch(base + "/api/auth/register", { method: "POST", redirect: "manual", body: new URLSearchParams({ name: "susan", email, password: randomBytes(20).toString("hex") }) });
  const normalCookie = registration.headers.get("set-cookie")?.match(/sb_session=[^;]+/)?.[0]; assert.ok(normalCookie);
  assert.equal((await request("/api/residanat?specialty=Cardiologie", "GET", undefined, "")).status, 401);
  assert.equal((await request("/api/residanat?specialty=Cardiologie", "GET", undefined, normalCookie)).status, 403);
  assert.equal((await request(`/api/residanat/${id}`, "PATCH", move, normalCookie)).status, 403);
  assert.equal((await request(`/api/residanat/${id}`, "DELETE")).status, 200);
  assert.equal((await data(`?lesson=${encodeURIComponent("Mon cours déplacé")}`)).questions.length, 0);
  assert.deepEqual((await data()).stats, initial.stats);
  console.log("PASS lessons: access remains owner-only; deleting a temporary question removes its empty course");
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (ownerId && created.length) await db.delete(residanatQuestions).where(and(eq(residanatQuestions.userId, ownerId), inArray(residanatQuestions.id, created)));
  await db.delete(sessions).where(eq(sessions.token, token));
  await db.delete(authAttempts).where(eq(authAttempts.email, email));
  await db.delete(users).where(eq(users.email, email));
  await pool.end();
  console.log("Only temporary test records were removed; original questions and results preserved.");
});
