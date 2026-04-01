"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  LayoutDashboard,
  Settings,
  Wallet,
  X,
  FilePlus2,
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

type SidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

type NavItem = {
  label: string;
  href: string;
  icon: (props: { className?: string }) => ReactNode;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: (p) => <LayoutDashboard {...p} /> },
  { label: "Wallet", href: "/wallet", icon: (p) => <Wallet {...p} /> },
  { label: "Transactions", href: "/transactions", icon: (p) => <ArrowLeftRight {...p} /> },
  { label: "Request", href: "/request", icon: (p) => <FilePlus2 {...p} /> },
  { label: "Settings", href: "/settings", icon: (p) => <Settings {...p} /> },
];

function isActivePath(currentPath: string, href: string) {
  return currentPath === href || (href !== "/" && currentPath.startsWith(`${href}/`));
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, authenticated } = usePrivy();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 bg-slate-950 text-white lg:flex lg:flex-col">
        <button
          type="button"
          onClick={() => {
            if (ready && authenticated) router.push("/dashboard");
          }}
          className="flex h-16 items-center px-5"
          aria-label="Go to dashboard"
        >
          <Image
            src="/logo.png"
            alt="SwiftFix"
            width={120}
            height={24}
            className="h-6 w-auto"
            priority
          />
        </button>
        <nav className="flex flex-1 flex-col gap-2 px-3 py-5">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={[
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                  active ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-900",
                ].join(" ")}
              >
                {item.icon({ className: "h-5 w-5" })}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile overlay + drawer */}
      <div className={mobileOpen ? "lg:hidden" : "hidden lg:hidden"}>
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40"
          aria-label="Close navigation menu"
          onClick={onMobileClose}
        />

        <aside className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-slate-950 text-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-5">
            <button
              type="button"
              onClick={() => {
                if (ready && authenticated) router.push("/dashboard");
                onMobileClose();
              }}
              className="flex items-center"
              aria-label="Go to dashboard"
            >
              <Image
                src="/logo.png"
                alt="SwiftFix"
                width={120}
                height={24}
                className="h-6 w-auto"
                priority
              />
            </button>
            <button
              type="button"
              onClick={onMobileClose}
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-200 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-600"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-2 px-3 py-5">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={onMobileClose}
                  className={[
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                    active ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-900",
                  ].join(" ")}
                >
                  {item.icon({ className: "h-5 w-5" })}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>
    </>
  );
}

