import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { and, eq, inArray } from "drizzle-orm";
import { db, pool } from "@/db";
import { users, sessions, residanatAttempts } from "@/db/schema";
import { OWNER_EMAIL } from "@/lib/owner";
import a from "@/data/residanat/constantine-2021-03.json";
import b from "@/data/residanat/constantine-2022-02.json";
import c from "@/data/residanat/constantine-2022-12.json";
import d from "@/data/residanat/constantine-2023.json";

const base = "http://localhost:3000";
const exams = [a, b, c, d];
const token = randomBytes(32).toString("hex");
const attempts: string[] = [];
let ownerId: string | undefined;
async function main() {
  assert.ok(process.env.PLAYWRIGHT_MODULE);
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
  assert.equal((await fetch(base + "/api/health")).status, 200);
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
    page.on("request", (r: { url: () => string; method: () => string; postDataJSON: () => { attemptId?: string } }) => {
      if (r.method() === "POST" && /\/api\/residanat\/[^/]+\/answer$/.test(r.url())) { const id = r.postDataJSON()?.attemptId; if (id) attempts.push(id); }
    });
    const initialResponse = await page.goto(base + "/dashboard/residanat", { waitUntil: "networkidle" });
    await showLegacyQuestionView();
    assert.equal(initialResponse.status(), 200);
    const bytes = (await initialResponse.body()).length;
    assert.ok(bytes < 4000000, "Private page must stay below production response limits");
    assert.equal(await page.getByTestId("qcm-question").count(), 20);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await mkdir(".artifacts", { recursive: true });
    await page.screenshot({ path: ".artifacts/residanat-batch-mobile.png", fullPage: false });
    console.log(`PASS browser batch: private mobile view renders only 20 questions (${bytes} uncompressed bytes)`);

    for (const exam of exams) {
      await openSourceDocuments();
      const collection = page.getByRole("region", { name: "Document PDF importé" }).filter({ hasText: exam.title });
      assert.equal(await collection.count(), 1);
      assert.ok((await collection.innerText()).includes(`${exam.questionCount} questions importées`));
      assert.equal(await collection.getByRole("link", { name: "Ouvrir le PDF source ↗" }).getAttribute("href"), exam.sourceUrl);
      await page.locator("#residanat-search").fill("");
      const responsePromise = page.waitForResponse((r: { url: () => string; request: () => { method: () => string } }) => r.request().method() === "GET" && r.url().includes("/api/residanat?") && new URL(r.url()).searchParams.get("document") === exam.id && !new URL(r.url()).searchParams.has("q"));
      await page.locator("#residanat-document-filter").selectOption(exam.id);
      await showLegacyQuestionView();
      const data = await (await responsePromise).json();
      await page.locator(`[data-question-id="${data.questions[0].id}"]`).waitFor();
      assert.equal(await page.getByTestId("qcm-question").count(), 20);
      const pager = page.getByRole("navigation", { name: "Pagination des questions", exact: true });
      await pager.getByRole("button", { name: "Suivant →", exact: true }).click();
      await page.locator(`[data-question-id="${data.questions[20].id}"]`).waitFor();
      assert.ok(page.url().includes("page=2"));
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(await page.locator("#residanat-document-filter").inputValue(), exam.id);
      assert.equal(await pager.getByRole("combobox", { name: "Choisir une page" }).inputValue(), "2");
      const lastPage = Math.ceil(exam.questionCount / 20);
      await pager.getByRole("combobox", { name: "Choisir une page" }).selectOption(String(lastPage));
      await page.locator(`[data-question-id="${data.questions[data.questions.length - 1].id}"]`).waitFor();
      assert.equal(await page.getByTestId("qcm-question").count(), exam.questionCount - 20 * (lastPage - 1));
      await page.locator("#residanat-search").fill("Q1");
      await page.getByRole("button", { name: "Rechercher", exact: true }).click();
      const card = page.getByTestId("qcm-question").filter({ has: page.getByRole("heading", { name: exam.questions[0].prompt, exact: true }) });
      await card.waitFor();
      assert.equal(await page.getByTestId("qcm-question").count(), 1);
      assert.ok((await card.getByRole("link", { name: /Voir l’énoncé/ }).getAttribute("href")).endsWith("#page=1"));
      const retry = card.getByRole("button", { name: "Réessayer cette question" });
      if (await retry.count()) await retry.click();
      const correct = exam.questions[0].correctOptionIds;
      const wrong = correct.length > 1 ? correct[0] : "ABCDE".split("").find((id) => !correct.includes(id));
      await card.locator(`input[value="${wrong}"]`).check();
      await card.getByRole("button", { name: "Valider ma réponse" }).click();
      await card.getByTestId("qcm-feedback").filter({ hasText: "Réponse incorrecte" }).waitFor();
      assert.ok((await card.getAttribute("class")).includes("border-rose-300"));
      await retry.click();
      for (const id of correct) await card.locator(`input[value="${id}"]`).check();
      await card.getByRole("button", { name: "Valider ma réponse" }).click();
      await card.getByTestId("qcm-feedback").filter({ hasText: "Bonne réponse !" }).waitFor();
      assert.ok((await card.getAttribute("class")).includes("border-emerald-300"));
      await page.reload({ waitUntil: "networkidle" });
      await card.getByTestId("qcm-feedback").filter({ hasText: "Bonne réponse !" }).waitFor();
      assert.equal(await page.locator("#residanat-search").inputValue(), "Q1");
      console.log(`PASS browser batch: ${exam.examDate} source, pagination, refresh and red/green correction`);
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: ".artifacts/residanat-batch-desktop.png", fullPage: false });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    assert.deepEqual(errors, []);
    console.log("PASS browser batch: desktop layout and no uncaught JavaScript errors");
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (ownerId && attempts.length) await db.delete(residanatAttempts).where(and(eq(residanatAttempts.userId, ownerId), inArray(residanatAttempts.id, attempts)));
  await db.delete(sessions).where(eq(sessions.token, token));
  await pool.end();
  console.log("Only test sessions and attempts were removed.");
});
