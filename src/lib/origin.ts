import "server-only";

import { headers } from "next/headers";

export async function getOrigin(): Promise<string> {
  const store = await headers();
  const host =
    store.get("x-forwarded-host") ?? store.get("host") ?? "localhost:3000";
  const proto =
    store.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  return `${proto}://${host}`;
}
