import "server-only";

import { notFound } from "next/navigation";
import { getCurrentUser, requireUser, type SessionUser } from "@/lib/auth";
import { isOwnerEmail } from "@/lib/owner";
import { UUID_PATTERN } from "@/lib/residanat-model";

type OwnerIdentity = Pick<SessionUser, "id" | "email" | "isAdmin">;

/** Uses the live site's existing owner identity; editable display names never grant access. */
export function isSiteOwner(user: OwnerIdentity | null): boolean {
  if (!user) return false;
  const pinnedId = process.env.OWNER_USER_ID?.trim();
  if (pinnedId) {
    // An explicitly configured UUID takes precedence and fails closed when invalid.
    return UUID_PATTERN.test(pinnedId) && user.id.toLowerCase() === pinnedId.toLowerCase();
  }
  // Existing production account: both the authenticated email and database admin flag must match.
  return user.isAdmin === true && isOwnerEmail(user.email);
}

export async function requireSiteOwner(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isSiteOwner(user)) notFound();
  return user;
}

export async function authorizeResidanat(request: Request): Promise<
  { user: SessionUser; response?: never } | { response: Response; user?: never }
> {
  const user = await getCurrentUser();
  if (!user) return { response: Response.json({ error: "Connectez-vous pour continuer." }, { status: 401 }) };
  if (!isSiteOwner(user)) return { response: Response.json({ error: "Cet espace est réservé au propriétaire du site." }, { status: 403 }) };

  if (request.method !== "GET") {
    if (request.headers.get("sec-fetch-site") === "cross-site") {
      return { response: Response.json({ error: "Origine de la requête non autorisée." }, { status: 403 }) };
    }
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        const host = new URL(origin).host;
        const allowed = [new URL(request.url).host, request.headers.get("host"), request.headers.get("x-forwarded-host")?.split(",")[0].trim()];
        if (!allowed.includes(host)) return { response: Response.json({ error: "Origine de la requête non autorisée." }, { status: 403 }) };
      } catch {
        return { response: Response.json({ error: "Origine invalide." }, { status: 403 }) };
      }
    }
  }
  return { user };
}
