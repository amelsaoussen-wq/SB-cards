import { redirect } from "next/navigation";
import { destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await destroySession();
  } catch (error) {
    console.error("[logout] failed", error);
  }
  redirect("/login");
}

export async function GET() {
  redirect("/login");
}
