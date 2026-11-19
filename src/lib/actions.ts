"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureDatabaseReady } from "@/db/bootstrap";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { CardInput } from "@/lib/card-types";

export type { CardInput };

export type AuthState = {
  error?: string;
  ok?: boolean;
};

export type ActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
};

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function updateProfileAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  try {
    await ensureDatabaseReady();
  } catch {
    return { error: "Le service est momentanément indisponible. Réessayez." };
  }

  const user = await getCurrentUser();
  if (!user) return { error: "Votre session a expiré. Reconnectez-vous." };

  const name = text(formData.get("name"));
  const clinic = text(formData.get("clinic"));
  const role = text(formData.get("role"));

  if (name.length < 2) {
    return { error: "Le nom doit contenir au moins 2 caractères." };
  }

  try {
    await db
      .update(users)
      .set({
        name: name.slice(0, 80),
        clinic: clinic.slice(0, 160),
        role: (role || "Concepteur de cartes").slice(0, 80),
      })
      .where(eq(users.id, user.id));
  } catch {
    return { error: "La mise à jour a échoué. Réessayez." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function changePasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  try {
    await ensureDatabaseReady();
  } catch {
    return { error: "Le service est momentanément indisponible. Réessayez." };
  }

  const user = await getCurrentUser();
  if (!user) return { error: "Votre session a expiré. Reconnectez-vous." };

  const current = text(formData.get("current"));
  const next = text(formData.get("next"));
  const confirm = text(formData.get("confirm"));

  if (next.length < 6) {
    return { error: "Le nouveau mot de passe doit contenir au moins 6 caractères." };
  }
  if (next !== confirm) {
    return { error: "Les deux nouveaux mots de passe ne correspondent pas." };
  }

  try {
    const rows = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    const row = rows[0];
    if (!row || !verifyPassword(current, row.passwordHash)) {
      return { error: "Le mot de passe actuel est incorrect." };
    }

    await db
      .update(users)
      .set({ passwordHash: hashPassword(next) })
      .where(eq(users.id, user.id));
  } catch {
    return { error: "La mise à jour a échoué. Réessayez." };
  }

  return { ok: true };
}
