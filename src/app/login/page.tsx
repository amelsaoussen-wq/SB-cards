import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { LoginForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";
import { safeEnsureDatabaseReady } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

export const metadata = { title: "Connexion — SB Cards" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string; next?: string }>;
}) {
  await safeEnsureDatabaseReady();
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;

  return (
    <AuthScreen
      title="Bon retour au studio"
      subtitle="Connectez-vous pour retrouver vos cartes, leurs indices et votre modèle rose & or."
    >
      <LoginForm
        error={params.error}
        email={params.email}
        next={params.next ?? "/dashboard"}
      />
    </AuthScreen>
  );
}
