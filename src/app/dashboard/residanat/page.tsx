import { ensureDatabaseReady } from "@/db/bootstrap";
import { ensureResidanatSchema } from "@/db/residanat-bootstrap";
import { requireSiteOwner } from "@/lib/residanat-access";
import { getPracticeData, seedResidanatExamples } from "@/lib/residanat";
import { importOwnerDocument } from "@/lib/residanat-imports";
import { ResidanatWorkspace } from "@/components/residanat/workspace";

export const dynamic = "force-dynamic";
export const metadata = { title: "Résidanat privé — SB Cards", robots: { index: false, follow: false } };

export default async function ResidanatPage() {
  await ensureDatabaseReady();
  const user = await requireSiteOwner();
  await ensureResidanatSchema();
  await seedResidanatExamples(user.id);
  await importOwnerDocument(user);
  const data = await getPracticeData(user.id);
  return <ResidanatWorkspace initial={data} />;
}
