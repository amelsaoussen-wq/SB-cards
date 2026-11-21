import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getWorkspaceStats } from "@/lib/cards";
import { SettingsForm } from "@/components/settings-form";
import { ChangePasswordForm } from "@/components/change-password-form";
import { AvatarUploader } from "@/components/avatar-uploader";
import { PageHeader, StatCard } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Paramètres — SB Cards" };

export default async function SettingsPage() {
  const user = await requireUser();
  const stats = await getWorkspaceStats(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compte"
        title="Paramètres du studio"
        description="Vos informations d’auteur apparaissent dans la navigation. Le design des cartes reste verrouillé pour toute l’équipe."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Cartes créées" value={stats.total} hint={`${stats.published} publiées`} icon={<span className="font-serif text-base font-bold">SB</span>} />
        <StatCard label="Scans QR" value={stats.views.toLocaleString("fr-FR")} hint="Lectures publiques" icon={<span aria-hidden="true">✦</span>} />
        <StatCard label="Impressions" value={stats.prints} hint="Recto/verso" icon={<span aria-hidden="true">🖨</span>} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
        <section className="sb-panel p-5 sm:p-6">
          <h2 className="font-serif text-lg font-bold text-plum-900">Photo de profil</h2>
          <p className="mt-1 text-sm text-plum-900/55">Votre photo apparaît sur votre chaîne et vos publications.</p>
          <div className="mt-4"><AvatarUploader name={user.name} initialAvatar={user.avatar} /></div>
        </section>
        <section className="sb-panel p-5 sm:p-6">
          <h2 className="font-serif text-lg font-bold text-plum-900">
            Profil auteur
          </h2>
          <p className="mt-1 text-sm text-plum-900/55">
            Ces informations restent internes et ne s’impriment pas sur les
            cartes.
          </p>
          <div className="mt-5">
            <SettingsForm
              name={user.name}
              clinic={user.clinic}
              role={user.role}
              email={user.email}
            />
          </div>
        </section>

        <section className="sb-panel p-5 sm:p-6">
          <h2 className="font-serif text-lg font-bold text-plum-900">
            Mot de passe
          </h2>
          <p className="mt-1 text-sm text-plum-900/55">
            Choisissez un nouveau mot de passe pour votre compte.
          </p>
          <div className="mt-5">
            <ChangePasswordForm />
          </div>
        </section>
        </div>

        <div className="space-y-5">
          <section className="sb-panel p-5">
            <h2 className="font-serif text-lg font-bold text-plum-900">
              Espace de travail
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-plum-900/55">Compte</dt>
                <dd className="truncate font-semibold text-plum-900">
                  {user.email}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-plum-900/55">Membre depuis</dt>
                <dd className="font-semibold text-plum-900">
                  {formatDate(user.createdAt.toISOString())}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-plum-900/55">Spécialités</dt>
                <dd className="font-semibold text-plum-900">
                  {stats.specialties.length}
                </dd>
              </div>
            </dl>
            <form action="/api/auth/logout" method="post" className="mt-4">
              <button type="submit" className="sb-btn-secondary w-full">
                Se déconnecter
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-gold-300/60 bg-[linear-gradient(150deg,#fffaf0,#fdf0f6)] p-5">
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-gold-500">
              ✦ Modèle partagé
            </p>
            <h2 className="mt-2 font-serif text-lg font-bold text-plum-900">
              Un seul design, six indices.
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-plum-900/65">
              Toutes les cartes générées utilisent la même grille rose &amp; or.
              Le contenu médical est le seul élément variable.
            </p>
            <Link
              href="/dashboard/templates"
              className="mt-3 inline-flex text-xs font-bold text-blush-700 hover:underline"
            >
              Explorer le modèle →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
