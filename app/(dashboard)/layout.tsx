import type { ReactNode } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"],
});

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard>
      <div
        className={[
          poppins.className,
          "text-[15px] font-normal tracking-wide leading-relaxed",
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight",
          "[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight",
          "[&_h3]:text-2xl [&_h3]:font-bold [&_h3]:tracking-tight",
        ].join(" ")}
      >
        <DashboardShell>{children}</DashboardShell>
      </div>
    </AuthGuard>
  );
}

