import { AuthScreen } from "@/components/auth-screen";
import { ForgotForm } from "@/components/forgot-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mot de passe oublié — SB Cards" };

export default function ForgotPasswordPage() {
  return (
    <AuthScreen
      title="Mot de passe oublié ?"
      subtitle="Entrez votre e-mail : nous vous envoyons un lien pour choisir un nouveau mot de passe."
    >
      <ForgotForm />
    </AuthScreen>
  );
}
