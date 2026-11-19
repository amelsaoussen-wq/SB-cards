import "server-only";

import QRCode from "qrcode";

/**
 * Génère un QR code côté serveur sous forme de data-URI SVG.
 * Aucun JavaScript côté client n'est nécessaire pour l'afficher.
 */
export async function qrDataUrl(value: string): Promise<string> {
  try {
    const svg = await QRCode.toString(value, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
    });
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  } catch {
    return "";
  }
}
