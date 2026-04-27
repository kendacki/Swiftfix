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
          "text-[14px] font-normal tracking-normal leading-relaxed sm:text-[15px] sm:tracking-wide",
          "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:tracking-tight sm:[&_h1]:text-2xl",
          "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight sm:[&_h2]:text-2xl",
          "[&_h3]:text-lg [&_h3]:font-bold [&_h3]:tracking-tight sm:[&_h3]:text-2xl",
        ].join(" ")}
      >
        <DashboardShell>{children}</DashboardShell>
      </div>
    </AuthGuard>
  );
}

