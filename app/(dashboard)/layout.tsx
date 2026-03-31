import type { ReactNode } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { AuthGuard } from "@/components/AuthGuard";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}

