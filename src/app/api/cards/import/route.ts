import { redirect } from "next/navigation";
import { ensureDatabaseReady } from "@/db/bootstrap";
import { getCurrentUser } from "@/lib/auth";
import { importStarterCards } from "@/lib/card-mutations";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  try {
    await ensureDatabaseReady();
    await importStarterCards(user.id);
  } catch (error) {
    console.error("[import starters]", error);
    redirect("/dashboard/cards?import=error");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cards");
  redirect("/dashboard/cards?import=ok");
}
