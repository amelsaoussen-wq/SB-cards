"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr" translate="no">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          background: "#fdf6f9",
          color: "#40112b",
          fontFamily: "Georgia, serif",
          padding: 24,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 26, margin: 0 }}>SB Cards</h1>
        <p style={{ maxWidth: 420, fontSize: 14, lineHeight: 1.6, color: "#7f2152" }}>
          Une erreur inattendue est survenue. Vos cartes enregistrées sont
          conservées. Rechargez la page pour continuer.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            background: "#c22f77",
            color: "#fff",
            border: 0,
            borderRadius: 10,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Recharger
        </button>
        <code style={{ fontSize: 11, color: "#a72c69" }}>{error.digest ?? ""}</code>
      </body>
    </html>
  );
}
