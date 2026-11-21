import type { ReactNode } from "react";
import { ensureDatabaseReady } from "@/db/bootstrap";
import { requireUser } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await ensureDatabaseReady();
  const user = await requireUser();

  return (
    <DashboardShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinic: user.clinic,
        isAdmin: user.isAdmin,
        avatar: user.avatar,
      }}
    >
      {children}
    </DashboardShell>
  );
}
