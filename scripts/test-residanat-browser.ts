import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { users, sessions, residanatQuestions, authAttempts } from "@/db/schema";
import { OWNER_EMAIL } from "@/lib/owner";

const base = "http://localhost:3000";
let ownerId = process.env.OWNER_USER_ID;
const token = randomBytes(32).toString("hex");
const email = `qcm-browser-${randomUUID()}@example.test`;
const password = randomBytes(18).toString("base64url");
let createdId: string | undefined;

async function main() {
  await fetch(base + "/api/health");
  if (!ownerId) {
    const [configuredOwner] = await db.select({ id: users.id, isAdmin: users.isAdmin }).from(users).where(eq(users.email, OWNER_EMAIL));
    assert.ok(configuredOwner?.isAdmin, "The existing owner must have the database admin flag; this test never creates or promotes an owner.");
    ownerId = configuredOwner.id;
  }

  assert.ok(process.env.PLAYWRIGHT_MODULE, "Point PLAYWRIGHT_MODULE to an isolated Playwright installation (index.mjs)");
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  await db.insert(sessions).values({ token, userId: ownerId, expiresAt: new Date(Date.now() + 3600000) });
  const errors: string[] = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addCookies([{ name: "sb_session", value: token, url: base, httpOnly: true, sameSite: "Lax" }]);
    const page = await context.newPage();
    page.on("pageerror", (error: Error) => errors.push(error.message));
    await page.goto(base + "/dashboard/residanat", { waitUntil: "networkidle" });
    assert.equal(await page.getByRole("heading", { name: "Résidanat", exact: true }).count(), 1);
    assert.ok(await page.getByRole("link", { name: /Résidanat/ }).isVisible());
    await mkdir(".artifacts", { recursive: true });
    await page.screenshot({ path: ".artifacts/residanat-desktop.png", fullPage: false });
    console.log("PASS browser: owner navigation and private workspace render");

    await page.getByRole("button", { name: "+ Ajouter un QCM", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    const prompt = `Question technique navigateur ${Date.now()} : choisir la bonne proposition.`;
    await page.locator("#qcm-specialty").selectOption("Pédiatrie");
    await page.locator("#qcm-prompt").fill(prompt);
    for (const id of ["A", "B", "C", "D"]) await page.getByRole("textbox", { name: `Proposition ${id}`, exact: true }).fill(`Contenu technique ${id}`);
    await page.getByRole("checkbox", { name: "Réponse correcte A", exact: true }).check();
    await page.locator("#qcm-explanation").fill("Explication technique : la proposition A est retenue pour ce test.");
    const creationResponse = page.waitForResponse((response: { url: () => string; status: () => number; request: () => { method: () => string } }) => response.url().endsWith("/api/residanat") && response.request().method() === "POST" && response.status() === 201);
    await page.getByRole("button", { name: "Enregistrer le QCM", exact: true }).click();
    createdId = (await (await creationResponse).json()).id;
    assert.ok(createdId);
    await dialog.waitFor({ state: "detached" });
    const card = page.locator(`[data-question-id="${createdId}"]`);
    await card.waitFor();
    console.log("PASS browser: native modal creates a persistent QCM");

    await card.locator('input[value="B"]').check();
    await card.getByRole("button", { name: "Valider ma réponse" }).click();
    await card.getByTestId("qcm-feedback").filter({ hasText: "Réponse incorrecte — consultez le corrigé." }).waitFor();
    assert.ok((await card.getAttribute("class")).includes("border-rose-300"));
    assert.ok((await card.locator('[data-option-id="B"]').getAttribute("class")).includes("bg-rose-50"));
    await card.getByRole("button", { name: "Réessayer cette question" }).click();
    await card.locator('input[value="A"]').check();
    await card.getByRole("button", { name: "Valider ma réponse" }).click();
    await card.getByTestId("qcm-feedback").filter({ hasText: "Bonne réponse !" }).waitFor();
    assert.ok((await card.getAttribute("class")).includes("border-emerald-300"));
    assert.ok(await card.getByText("Explication technique : la proposition A est retenue pour ce test.", { exact: true }).isVisible());
    await page.reload({ waitUntil: "networkidle" });
    await card.getByTestId("qcm-feedback").filter({ hasText: "Bonne réponse !" }).waitFor();
    console.log("PASS browser: red/green feedback, explained correction and reload persistence");

    await page.locator("#residanat-search").fill(prompt);
    await page.getByRole("button", { name: "Rechercher", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="qcm-question"]').length === 1);
    await page.locator("#residanat-specialty-filter").selectOption("Cardiologie");
    await page.getByText("Aucune question correspondante", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Voir toutes les questions", exact: true }).click();
    await page.locator("#residanat-search").fill(prompt);
    await page.getByRole("button", { name: "Rechercher", exact: true }).click();
    await card.waitFor();
    console.log("PASS browser: specialty filters, search and empty-state reset");

    await card.getByRole("button", { name: "Modifier la question", exact: true }).click();
    await dialog.waitFor();
    await page.locator("#qcm-prompt").fill(prompt + " Version modifiée.");
    await page.getByRole("checkbox", { name: "Réponse correcte A", exact: true }).uncheck();
    await page.getByRole("checkbox", { name: "Réponse correcte B", exact: true }).check();
    await page.getByRole("button", { name: "Enregistrer le QCM", exact: true }).click();
    await dialog.waitFor({ state: "detached" });
    await card.getByText(prompt + " Version modifiée.", { exact: true }).waitFor();
    assert.equal(await card.getByTestId("qcm-feedback").count(), 0);
    await card.locator('input[value="B"]').check();
    await card.getByRole("button", { name: "Valider ma réponse" }).click();
    await card.getByTestId("qcm-feedback").filter({ hasText: "Bonne réponse !" }).waitFor();
    console.log("PASS browser: editing changes grading and invalidates old displayed correction");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/dashboard/residanat", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, "Mobile page should not overflow horizontally");
    await page.screenshot({ path: ".artifacts/residanat-mobile.png", fullPage: false });
    await page.getByRole("button", { name: "Ouvrir le menu", exact: true }).click();
    assert.ok(await page.getByRole("link", { name: /Résidanat/ }).isVisible());
    await page.getByRole("button", { name: "Fermer le menu", exact: true }).click({ position: { x: 370, y: 200 } });
    await page.getByRole("button", { name: "+ Ajouter un QCM", exact: true }).click();
    await dialog.waitFor();
    const bounds = await dialog.boundingBox();
    assert.ok(bounds && bounds.width <= 390 && bounds.x >= 0);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    console.log("PASS browser: mobile layout, menu and accessible dialog");

    await page.locator("#residanat-search").fill(prompt);
    await page.getByRole("button", { name: "Rechercher", exact: true }).click();
    await card.waitFor();
    await card.getByRole("button", { name: "Supprimer la question", exact: true }).click();
    const deletion = page.waitForResponse((response: { url: () => string; status: () => number; request: () => { method: () => string } }) => response.url().endsWith(`/api/residanat/${createdId}`) && response.request().method() === "DELETE");
    await card.getByRole("button", { name: "Confirmer la suppression", exact: true }).click();
    assert.equal((await deletion).status(), 200);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await card.count(), 0);
    console.log("PASS browser: confirmed deletion remains deleted on reload");

    const anonymous = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const publicPage = await anonymous.newPage();
    publicPage.on("pageerror", (error: Error) => errors.push(error.message));
    await publicPage.goto(base + "/dashboard/residanat", { waitUntil: "networkidle" });
    assert.ok(publicPage.url().includes("/login"));
    await publicPage.goto(base + "/register", { waitUntil: "networkidle" });
    await publicPage.locator("#name").fill("susan");
    await publicPage.locator("#email").fill(email);
    await publicPage.locator("#password").fill(password);
    await publicPage.getByRole("button", { name: "Créer mon studio", exact: true }).click();
    await publicPage.waitForURL("**/explore?welcome=1");
    assert.equal(await publicPage.getByRole("link", { name: /Résidanat/ }).count(), 0);
    await publicPage.goto(base + "/dashboard/residanat", { waitUntil: "networkidle" });
    assert.equal(await publicPage.getByRole("heading", { name: "Résidanat", exact: true }).count(), 0);
    const forbidden = await anonymous.request.get(base + "/api/residanat");
    assert.equal(forbidden.status(), 403);
    console.log("PASS browser: fresh registration works; a same-name account cannot access owner QCMs");
    assert.deepEqual(errors, []);
    console.log("PASS browser: zero uncaught page errors");
  } finally { await browser.close(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (createdId && ownerId) await db.delete(residanatQuestions).where(and(eq(residanatQuestions.id, createdId), eq(residanatQuestions.userId, ownerId)));
  await db.delete(sessions).where(eq(sessions.token, token));
  await db.delete(authAttempts).where(eq(authAttempts.email, email));
  await db.delete(users).where(eq(users.email, email));
  await pool.end();
  console.log("Browser-test accounts, questions and sessions removed.");
});
