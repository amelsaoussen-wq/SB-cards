import { ensureDatabaseReady } from "@/db/bootstrap";
import { ensureResidanatSchema } from "@/db/residanat-bootstrap";
import { requireSiteOwner } from "@/lib/residanat-access";
import { getPracticeData, seedResidanatExamples } from "@/lib/residanat";
import { importOwnerDocument } from "@/lib/residanat-imports";
import { ResidanatWorkspace } from "@/components/residanat/workspace";

export const dynamic = "force-dynamic";
export const metadata = { title: "Résidanat privé — SB Cards", robots: { index: false, follow: false } };

type Search = { q?: string | string[]; specialty?: string | string[]; document?: string | string[]; page?: string | string[] };
function text(value: string | string[] | undefined): string { return typeof value === "string" ? value.slice(0, 160) : ""; }

export default async function ResidanatPage({ searchParams }: { searchParams: Promise<Search> }) {
  await ensureDatabaseReady();
  const user = await requireSiteOwner();
  await ensureResidanatSchema();
  await seedResidanatExamples(user.id);
  await importOwnerDocument(user);
  const params = await searchParams;
  const filters = { q: text(params.q), specialty: text(params.specialty), document: text(params.document) };
  const requested = Number(text(params.page));
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  const data = await getPracticeData(user.id, filters);
  return <ResidanatWorkspace key={JSON.stringify(filters) + page} initial={data} initialFilters={filters} initialPage={page} />;
}
