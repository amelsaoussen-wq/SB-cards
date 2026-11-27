import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { users, sessions, residanatQuestions } from "@/db/schema";
import { OWNER_EMAIL } from "@/lib/owner";

const base = "http://localhost:3000";
const token = randomBytes(32).toString("hex");
let ownerId: string | undefined;
let createdId: string | undefined;

async function main() {
  assert.ok(process.env.PLAYWRIGHT_MODULE, "Configure an isolated Playwright installation");
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
  await fetch(base + "/api/health");
  const [owner] = await db.select({ id: users.id }).from(users).where(process.env.OWNER_USER_ID
    ? eq(users.id, process.env.OWNER_USER_ID) : and(eq(users.email, OWNER_EMAIL), eq(users.isAdmin, true)));
  assert.ok(owner); ownerId = owner.id;
  await db.insert(sessions).values({ token, userId: owner.id, expiresAt: new Date(Date.now() + 3600000) });
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const errors: string[] = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addCookies([{ name: "sb_session", value: token, url: base, httpOnly: true, sameSite: "Lax" }]);
    const page = await context.newPage();
    page.on("pageerror", (error: Error) => errors.push(error.message));
    const response = await page.goto(base + "/dashboard/residanat", { waitUntil: "networkidle" });
    assert.equal(response.status(), 200);
    assert.ok((await response.body()).length < 4000000);
    assert.ok(await page.getByTestId("specialty-card").count() > 1);
    assert.equal(await page.getByTestId("qcm-question").count(), 0);
    assert.ok(await page.locator("#residanat-lesson-filter").isDisabled());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await mkdir(".artifacts", { recursive: true });
    await page.getByRole("heading", { name: "Choisir une spécialité", exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: ".artifacts/residanat-specialties-mobile.png", fullPage: false });
    console.log("PASS browser lessons: specialty catalogue is the default entry, with no question wall");

    await page.getByRole("button", { name: "Ouvrir la spécialité Cardiologie", exact: true }).click();
    await page.getByRole("heading", { name: "Les cours · Cardiologie", exact: true }).waitFor();
    await page.getByTestId("lesson-card").first().waitFor();
    assert.ok(await page.getByTestId("lesson-card").count() > 1);
    assert.equal(await page.getByTestId("qcm-question").count(), 0);
    await page.screenshot({ path: ".artifacts/residanat-courses-mobile.png", fullPage: false });
    await page.getByRole("button", { name: "Ouvrir le cours Valvulopathies", exact: true }).click();
    await page.getByRole("heading", { name: "Valvulopathies", exact: true }).waitFor();
    await page.getByTestId("qcm-question").first().waitFor();
    assert.ok(await page.getByTestId("qcm-question").count() <= 20);
    for (const card of await page.getByTestId("qcm-question").all()) assert.equal(await card.getByText("Valvulopathies", { exact: true }).count(), 1);
    assert.ok(new URL(page.url()).searchParams.get("lesson") === "Valvulopathies");
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Valvulopathies", exact: true }).waitFor();
    assert.equal(await page.locator("#residanat-specialty-filter").inputValue(), "Cardiologie");
    assert.equal(await page.locator("#residanat-lesson-filter").inputValue(), "Valvulopathies");
    console.log("PASS browser lessons: specialty → course → questions and reload preserve context");

    await page.getByRole("button", { name: "2 · Cardiologie", exact: true }).click();
    await page.getByTestId("lesson-card").first().waitFor();
    await page.getByRole("button", { name: "1 · Spécialités", exact: true }).click();
    await page.getByTestId("specialty-card").first().waitFor();
    await page.locator("#residanat-document-filter").selectOption("constantine-2025-10-25");
    await page.getByRole("button", { name: "Ouvrir la spécialité Cardiologie", exact: true }).click();
    await page.getByRole("button", { name: "Ouvrir le cours Valvulopathies", exact: true }).click();
    await page.getByRole("heading", { name: "Valvulopathies", exact: true }).waitFor();
    const first = page.getByTestId("qcm-question").first();
    await first.waitFor();
    assert.ok((await first.getByRole("link", { name: /Voir l’énoncé/ }).getAttribute("href")).includes("933464c1d6e341c69bd77a4b56c95fe4"));
    console.log("PASS browser lessons: breadcrumbs and annale filter keep courses in the chosen source");

    await page.getByRole("button", { name: "+ Ajouter un QCM", exact: true }).click();
    const dialog = page.getByRole("dialog"); await dialog.waitFor();
    assert.equal(await page.locator("#qcm-specialty").inputValue(), "Cardiologie");
    assert.equal(await page.locator("#qcm-lesson").inputValue(), "Valvulopathies");
    const prompt = `Question temporaire navigation cours ${randomUUID()}`;
    await page.locator("#qcm-prompt").fill(prompt);
    for (const id of ["A", "B", "C", "D"]) await page.getByRole("textbox", { name: `Proposition ${id}`, exact: true }).fill(`Proposition technique ${id}`);
    await page.getByRole("checkbox", { name: "Réponse correcte A", exact: true }).check();
    await page.locator("#qcm-explanation").fill("Explication de test temporaire avec la proposition A.");
    const creation = page.waitForResponse((r: { url: () => string; status: () => number; request: () => { method: () => string } }) => r.url().endsWith("/api/residanat") && r.request().method() === "POST" && r.status() === 201);
    await page.getByRole("button", { name: "Enregistrer le QCM", exact: true }).click();
    createdId = (await (await creation).json()).id;
    assert.ok(createdId); await dialog.waitFor({ state: "detached" });
    const card = page.locator(`[data-question-id="${createdId}"]`); await card.waitFor();
    await card.locator('input[value="B"]').check();
    await card.getByRole("button", { name: "Valider ma réponse" }).click();
    await card.getByTestId("qcm-feedback").filter({ hasText: "Réponse incorrecte" }).waitFor();
    await card.getByRole("button", { name: "Réessayer cette question" }).click();
    await card.locator('input[value="A"]').check();
    await card.getByRole("button", { name: "Valider ma réponse" }).click();
    await card.getByTestId("qcm-feedback").filter({ hasText: "Bonne réponse !" }).waitFor();
    console.log("PASS browser lessons: creation inherits the selected course and existing grading still works");

    await card.getByRole("button", { name: "Modifier la question", exact: true }).click(); await dialog.waitFor();
    const course = `Cours de test ${Date.now()}`;
    await page.locator("#qcm-lesson").fill(course);
    const moved = page.waitForResponse((r: { url: () => string; request: () => { method: () => string } }) => r.url().endsWith(`/api/residanat/${createdId}`) && r.request().method() === "PATCH");
    await page.getByRole("button", { name: "Enregistrer le QCM", exact: true }).click();
    assert.equal((await moved).status(), 200); await dialog.waitFor({ state: "detached" });
    await page.getByRole("heading", { name: course, exact: true }).waitFor();
    await card.getByTestId("qcm-feedback").filter({ hasText: "Bonne réponse !" }).waitFor();
    await page.reload({ waitUntil: "networkidle" });
    await card.getByTestId("qcm-feedback").filter({ hasText: "Bonne réponse !" }).waitFor();
    assert.equal(await page.locator("#residanat-lesson-filter").inputValue(), course);
    console.log("PASS browser lessons: moving a question preserves its correct answer and saved course");

    await card.getByRole("button", { name: "Supprimer la question", exact: true }).click();
    const deletion = page.waitForResponse((r: { url: () => string; request: () => { method: () => string } }) => r.url().endsWith(`/api/residanat/${createdId}`) && r.request().method() === "DELETE");
    await card.getByRole("button", { name: "Confirmer la suppression", exact: true }).click();
    assert.equal((await deletion).status(), 200);
    await page.getByRole("button", { name: "2 · Cardiologie", exact: true }).click();
    await page.getByRole("heading", { name: "Les cours · Cardiologie", exact: true }).waitFor();
    await page.getByTestId("lesson-card").first().waitFor();
    assert.equal(await page.getByRole("button", { name: `Ouvrir le cours ${course}`, exact: true }).count(), 0);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: ".artifacts/residanat-courses-desktop.png", fullPage: false });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    assert.deepEqual(errors, []);
    console.log("PASS browser lessons: deletion removes the empty course; mobile/desktop work without page errors");
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (createdId && ownerId) await db.delete(residanatQuestions).where(and(eq(residanatQuestions.id, createdId), eq(residanatQuestions.userId, ownerId)));
  await db.delete(sessions).where(eq(sessions.token, token));
  await pool.end();
  console.log("Only the temporary question and session were removed.");
});
