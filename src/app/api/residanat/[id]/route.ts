import { withResidanat, readQcmJson } from "@/lib/residanat-api";
import { getEditableQuestion, saveQuestion, removeQuestion, QcmError } from "@/lib/residanat";
import { UUID_PATTERN, validateQcm } from "@/lib/residanat-model";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

async function questionId(context: Context): Promise<string> {
  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) throw new QcmError("Question introuvable.", 404);
  return id;
}

export async function GET(request: Request, context: Context) {
  return withResidanat(request, async (user) => Response.json(await getEditableQuestion(user.id, await questionId(context))));
}

export async function PUT(request: Request, context: Context) {
  return withResidanat(request, async (user) => {
    const id = await questionId(context);
    const result = validateQcm(await readQcmJson(request));
    if ("error" in result) throw new QcmError(result.error, 400);
    return Response.json({ id: await saveQuestion(user.id, result.data, id) });
  });
}

export async function DELETE(request: Request, context: Context) {
  return withResidanat(request, async (user) => {
    await removeQuestion(user.id, await questionId(context));
    return Response.json({ deleted: true });
  });
}
