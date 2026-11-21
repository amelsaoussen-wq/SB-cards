/** Compte propriétaire / administrateur de la marque SB Cards. */
export const OWNER_EMAIL = "amelsaoussen@gmail.com";

export function isOwnerEmail(email: string): boolean {
  return email.trim().toLowerCase() === OWNER_EMAIL;
}
