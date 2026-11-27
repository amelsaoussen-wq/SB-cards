import { withResidanat, readQcmJson } from "@/lib/residanat-api";
import { getPracticeData, saveQuestion, seedResidanatExamples, QcmError } from "@/lib/residanat";
import { importOwnerDocument } from "@/lib/residanat-imports";
import { validateQcm } from "@/lib/residanat-model";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  return withResidanat(request, async (user) => {
    await seedResidanatExamples(user.id);
    await importOwnerDocument(user);
    const params = new URL(request.url).searchParams;
    return Response.json(await getPracticeData(user.id, {
      q: params.get("q") ?? "", specialty: params.get("specialty") ?? "", document: params.get("document") ?? "", lesson: params.get("lesson") ?? "",
    }));
  });
}

export async function POST(request: Request) {
  return withResidanat(request, async (user) => {
    const result = validateQcm(await readQcmJson(request));
    if ("error" in result) throw new QcmError(result.error, 400);
    const id = await saveQuestion(user.id, result.data);
    return Response.json({ id }, { status: 201 });
  });
}
