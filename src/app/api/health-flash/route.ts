import { pickFlash, type HealthFlash } from "@/lib/health-flash";

export const dynamic = "force-dynamic";

/**
 * Génère une « omflash » santé courte.
 * Si OPENAI_API_KEY est défini → génération par IA ; sinon base factuelle.
 */
export async function GET() {
  const key = process.env.OPENAI_API_KEY;
  if (key) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          response_format: { type: "json_object" },
          temperature: 0.9,
          messages: [
            {
              role: "system",
              content:
                "Tu es un assistant de santé publique fiable. Génère UNE actualité/info santé courte, factuelle et datée si possible (journée mondiale de santé, recommandation OMS, maladie émergente, ou nouveau traitement). Réponds en JSON: {tag, emoji, title, short, full}. 'short' = une phrase lisible en 5 secondes. 'full' = un paragraphe de 3-4 phrases explicatif. En français. Pas de conseil dangereux, pas de fabrication de chiffres.",
            },
            {
              role: "user",
              content: `Génère une info santé variée (seed ${Date.now()}).`,
            },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
        if (parsed.title && parsed.short) {
          const flash: HealthFlash = {
            id: `ai-${Date.now()}`,
            tag: parsed.tag ?? "Info santé",
            emoji: parsed.emoji ?? "🩺",
            title: parsed.title,
            short: parsed.short,
            full: parsed.full ?? parsed.short,
          };
          return Response.json({ ok: true, flash, source: "ai" });
        }
      }
    } catch {
      /* repli base factuelle */
    }
  }
  return Response.json({ ok: true, flash: pickFlash(), source: "curated" });
}
