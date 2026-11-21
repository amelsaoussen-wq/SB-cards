import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cards, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { AdminUsers } from "@/components/admin-users";
import { PageHeader, StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Administration — SB Cards" };

export default async function AdminPage() {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/dashboard");

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      isAdmin: users.isAdmin,
      cards: sql<number>`count(${cards.id})::int`,
    })
    .from(users)
    .leftJoin(cards, eq(cards.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt));

  const totalCards = rows.reduce((a, r) => a + r.cards, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Propriétaire"
        title="Administration de la marque"
        description="Vous contrôlez SB Cards : gérez les membres et modérez le contenu. Votre compte est le compte officiel."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Membres" value={rows.length} hint="comptes inscrits" icon={<span aria-hidden="true">👥</span>} />
        <StatCard label="Cartes totales" value={totalCards} hint="toutes chaînes" icon={<span aria-hidden="true">🗂</span>} />
        <StatCard label="Votre rôle" value="👑" hint="Propriétaire / modérateur" icon={<span aria-hidden="true">🛡</span>} />
      </div>

      <AdminUsers rows={rows} selfId={user.id} />

      <p className="text-xs leading-relaxed text-plum-900/50">
        En tant que propriétaire, vous pouvez aussi supprimer n’importe quelle
        carte ou commentaire depuis la bibliothèque publique (modération).
      </p>
    </div>
  );
}
