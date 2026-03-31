"use client";

import { usePrivy } from "@privy-io/react-auth";
import { CircleUser, LogIn, LogOut, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import ProfileAvatarUpload from "@/components/ProfileAvatarUpload";

type HeaderProps = {
  onOpenMobileSidebar: () => void;
};

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const displayIdentifier =
    user?.phone?.number ?? user?.email?.address ?? "User";

  const avatarUrl = useMemo(() => {
    const meta = (user as unknown as { customMetadata?: Record<string, unknown> })
      ?.customMetadata;
    const v = meta?.avatarUrl;
    return typeof v === "string" && v.length > 0 ? v : null;
  }, [user]);

  useEffect(() => {
    if (!profileOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };

    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const el = profileRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setProfileOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [profileOpen]);

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

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300"
              aria-label="Profile"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <CircleUser className="h-6 w-6" />
              )}
            </button>

            {profileOpen && ready && authenticated ? (
              <div className="absolute right-0 top-12 z-50 w-[320px] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
                <div className="border-b border-zinc-200 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Profile
                  </div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {displayIdentifier}
                  </div>
                </div>
                <div className="p-4">
                  <ProfileAvatarUpload />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

