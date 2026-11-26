import { withResidanat, readQcmJson } from "@/lib/residanat-api";
import { submitAnswer, QcmError } from "@/lib/residanat";
import { UUID_PATTERN } from "@/lib/residanat-model";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withResidanat(request, async (user) => {
    const { id } = await params;
    if (!UUID_PATTERN.test(id)) throw new QcmError("Question introuvable.", 404);
    const raw = await readQcmJson(request);
    if (!raw || typeof raw !== "object") throw new QcmError("Données invalides.", 400);
    const input = raw as Record<string, unknown>;
    if (typeof input.attemptId !== "string" || !UUID_PATTERN.test(input.attemptId) || !Number.isInteger(input.version) || typeof input.version !== "number" || input.version < 1 || !Array.isArray(input.selectedOptionIds) || input.selectedOptionIds.length < 1 || input.selectedOptionIds.length > 6 || !input.selectedOptionIds.every((item) => typeof item === "string" && /^[A-F]$/.test(item))) {
      throw new QcmError("Sélectionnez une réponse et rechargez la page si nécessaire.", 400);
    }
    return Response.json(await submitAnswer(user.id, id, input.attemptId, input.version, input.selectedOptionIds));
  });
}
