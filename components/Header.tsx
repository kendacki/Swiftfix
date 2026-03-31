"use client";

import { usePrivy } from "@privy-io/react-auth";
import { CircleUser, LogIn, LogOut, Menu } from "lucide-react";
import { usePathname } from "next/navigation";

type HeaderProps = {
  onOpenMobileSidebar: () => void;
};

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const pathname = usePathname();

  const displayIdentifier =
    user?.phone?.number ?? user?.email?.address ?? "User";

  const pageTitle = (() => {
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/"))
      return "Dashboard";
    if (pathname === "/wallet" || pathname.startsWith("/wallet/")) return "Wallet";
    if (pathname === "/transactions" || pathname.startsWith("/transactions/"))
      return "Transactions";
    if (pathname === "/request" || pathname.startsWith("/request/")) return "Request";
    if (pathname === "/settings" || pathname.startsWith("/settings/")) return "Settings";
    return "Dashboard";
  })();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="inline-flex items-center justify-center rounded-md p-2 text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="text-sm font-semibold text-zinc-900 sm:text-base">
            {pageTitle}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {ready && authenticated ? (
            <>
              <div className="max-w-[10rem] truncate text-sm font-medium text-zinc-700 sm:max-w-none">
                Welcome, {displayIdentifier}
              </div>

              <button
                type="button"
                onClick={() => {
                  void logout();
                }}
                className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                login();
              }}
              className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300"
            >
              <LogIn className="h-4 w-4" />
              Login
            </button>
          )}

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full p-2 text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-300"
            aria-label="Profile"
          >
            <CircleUser className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}

