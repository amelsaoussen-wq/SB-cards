import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { RegisterForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";
import { safeEnsureDatabaseReady } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

export const metadata = { title: "Créer un compte — SB Cards" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  await safeEnsureDatabaseReady();
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;

  return (
    <AuthScreen
      title="Créez votre studio"
      subtitle="Quelques secondes suffisent pour générer vos premières cartes de raisonnement clinique."
    >
      <RegisterForm error={params.error} email={params.email} />
    </AuthScreen>
  );
}
