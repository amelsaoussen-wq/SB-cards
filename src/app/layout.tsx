import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SwRegister } from "@/components/sw-register";

export const metadata: Metadata = {
  title: "SB Cards — Studio de cartes médicales",
  description:
    "Créez, personnalisez et partagez des cartes de raisonnement clinique : un diagnostic, six indices, un design rose & or toujours identique.",
  applicationName: "SB Cards",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SB Cards",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/app-icon-512.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fdf6f9",
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
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
