import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SB Cards — Studio de cartes médicales",
  description:
    "Créez, personnalisez et partagez des cartes de raisonnement clinique : un diagnostic, six indices, un design rose & or toujours identique.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // translate="no" : la traduction automatique du navigateur mute le DOM
    // et provoque des erreurs d'hydratation React (écran « Réessayer »).
    <html lang="fr" translate="no">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="bg-blush-50 font-sans text-plum-900 antialiased">
        {children}
      </body>
    </html>
  );
}
