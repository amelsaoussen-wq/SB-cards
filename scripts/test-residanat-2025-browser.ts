import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { and, eq, inArray } from "drizzle-orm";
import { db, pool } from "@/db";
import { users, sessions, residanatAttempts } from "@/db/schema";
import { OWNER_EMAIL } from "@/lib/owner";

const base = "http://localhost:3000";
const token = randomBytes(32).toString("hex");
const attempts: string[] = [];
let ownerId: string | undefined;

async function main() {
  assert.ok(process.env.PLAYWRIGHT_MODULE, "Isolated Playwright module is required");
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
    async function showLegacyQuestionView() {
      const all = page.getByRole("button", { name: "Toutes les questions", exact: true });
      if (await all.count()) await all.click();
    }
    async function openSourceDocuments() {
      const details = page.getByTestId("source-documents");
      if (await details.count() && await details.getAttribute("open") === null) await details.locator("summary").click();
    }

    page.on("pageerror", (error: Error) => errors.push(error.message));
    page.on("request", (request: { url: () => string; method: () => string; postDataJSON: () => { attemptId?: string } }) => {
      if (request.method() === "POST" && /\/api\/residanat\/[^/]+\/answer$/.test(request.url())) {
        const id = request.postDataJSON()?.attemptId;
        if (id) attempts.push(id);
      }
    });
    await page.goto(base + "/dashboard/residanat", { waitUntil: "networkidle" });
    await showLegacyQuestionView();
    await openSourceDocuments();
    const collection = page.getByRole("region", { name: "Document PDF importé" }).filter({ hasText: "25 octobre 2025" });
    await collection.waitFor();
    assert.match(await collection.innerText(), /150 questions importées/);
    const sourceLink = collection.getByRole("link", { name: "Ouvrir le PDF source ↗" });
    assert.ok((await sourceLink.getAttribute("href")).includes("414868_933464c1d6e341c69bd77a4b56c95fe4.pdf"));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await mkdir(".artifacts", { recursive: true });
    await page.screenshot({ path: ".artifacts/residanat-pdf-2025-mobile.png", fullPage: false });
    console.log("PASS browser 2025: actual import receipt, source link and mobile layout");

    await collection.getByRole("button", { name: "Voir ces questions" }).click();
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="qcm-question"]').length === 20);
    await page.locator("#residanat-search").fill("Q64");
    await page.getByRole("button", { name: "Rechercher", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="qcm-question"]').length === 1);
    const sourceQuestion = page.getByTestId("qcm-question");
    assert.match(await sourceQuestion.innerText(), /kaliémie à 3,2 g\/l/);
    assert.match(await sourceQuestion.innerText(), /PDF · Question 64/);
    assert.ok((await sourceQuestion.getByRole("link", { name: /Voir l’énoncé/ }).getAttribute("href")).endsWith("#page=9"));
    console.log("PASS browser 2025: original question number and matching source page");

    await page.locator("#residanat-search").fill("");
    await page.locator("#residanat-specialty-filter").selectOption("Anatomie pathologique");
    await showLegacyQuestionView();
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="qcm-question"]').length === 13);
    const question = page.getByTestId("qcm-question").filter({ has: page.getByRole("heading", { name: "Le carcinome épidermoïde :", exact: true }) });
    await question.waitFor();
    const id = await question.getAttribute("data-question-id");
    const retry = question.getByRole("button", { name: "Réessayer cette question" });
    if (await retry.count()) await retry.click();
    await question.locator('input[value="A"]').check();
    await question.getByRole("button", { name: "Valider ma réponse" }).click();
    await question.getByTestId("qcm-feedback").filter({ hasText: "Réponse incorrecte" }).waitFor();
    assert.ok((await question.getAttribute("class")).includes("border-rose-300"));
    await question.getByRole("button", { name: "Réessayer cette question" }).click();
    await question.locator('input[value="C"]').check();
    await question.locator('input[value="D"]').check();
    await question.getByRole("button", { name: "Valider ma réponse" }).click();
    await question.getByTestId("qcm-feedback").filter({ hasText: "Bonne réponse !" }).waitFor();
    assert.ok((await question.getAttribute("class")).includes("border-emerald-300"));
    assert.match(await question.innerText(), /Corrigé du document/);
    assert.match(await question.innerText(), /question 1 : C, D/);
    assert.match(await question.innerText(), /sans justification médicale détaillée/);
    console.log("PASS browser 2025: wrong/right answers use the supplied key and explanation provenance");

    await page.reload({ waitUntil: "networkidle" });
    const persisted = page.locator(`[data-question-id="${id}"]`);
    await persisted.getByTestId("qcm-feedback").filter({ hasText: "Bonne réponse !" }).waitFor();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: ".artifacts/residanat-pdf-2025-desktop.png", fullPage: false });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await page.locator("#residanat-document-filter").selectOption("constantine-2026-10-17");
    await showLegacyQuestionView();
    await page.getByRole("heading", { name: "Les ostéomes :", exact: true }).waitFor();
    assert.equal(await page.getByTestId("qcm-question").count(), 20);
    await page.locator("#residanat-document-filter").selectOption("constantine-2025-10-25");
    await showLegacyQuestionView();
    await page.getByRole("heading", { name: "Le carcinome épidermoïde :", exact: true }).waitFor();
    assert.equal(await page.getByTestId("qcm-question").count(), 20);
    console.log("PASS browser 2025: both source years remain independently accessible");
    assert.deepEqual(errors, []);
    console.log("PASS browser 2025: saved result survives reload; desktop layout and JavaScript are healthy");
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (ownerId && attempts.length) await db.delete(residanatAttempts).where(and(eq(residanatAttempts.userId, ownerId), inArray(residanatAttempts.id, attempts)));
  await db.delete(sessions).where(eq(sessions.token, token));
  await pool.end();
  console.log("Only this browser test's session and attempts were removed.");
});
