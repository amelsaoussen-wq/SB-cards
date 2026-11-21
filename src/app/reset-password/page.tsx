import { AuthScreen } from "@/components/auth-screen";
import { ResetForm } from "@/components/reset-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nouveau mot de passe — SB Cards" };

export default function ResetPasswordPage() {
  return (
    <AuthScreen
      title="Nouveau mot de passe"
      subtitle="Choisissez un nouveau mot de passe pour votre compte SB Cards."
    >
      <ResetForm />
    </AuthScreen>
  );
}
