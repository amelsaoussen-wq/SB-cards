export class PracticeRequestError extends Error {
  constructor(message: string, readonly status = 0) { super(message); }
}

export async function practiceRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...options, credentials: "same-origin", cache: "no-store",
      headers: { "Content-Type": "application/json", ...options.headers } });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new PracticeRequestError("Connexion interrompue. Réessayez : votre saisie est conservée.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new PracticeRequestError(data?.error ?? "La demande n’a pas abouti. Réessayez.", response.status);
  if (data === null) throw new PracticeRequestError("Réponse du serveur invalide. Rechargez la page.");
  return data as T;
}
