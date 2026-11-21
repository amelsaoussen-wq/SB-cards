"use client";

import { useEffect } from "react";

/** Enregistre le service worker pour l'installation en tant qu'application. */
export function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);
  return null;
}
