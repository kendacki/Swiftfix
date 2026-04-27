"use client";

import { LogIn, LogOut, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ProfileAvatarUpload from "@/components/ProfileAvatarUpload";
import { useUserDisplay } from "@/hooks/useUserDisplay";

type HeaderProps = {
  onOpenMobileSidebar: () => void;
};

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const {
    ready,
    authenticated,
    login,
    logout,
    displayName,
    avatarUrl,
  } = useUserDisplay();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

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
    if (pathname === "/profile" || pathname.startsWith("/profile/")) return "Profile";
    if (pathname === "/kyc" || pathname.startsWith("/kyc/"))
      return "Identity Verification";
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

          <Link
            href="/dashboard"
            prefetch={false}
            className="hidden items-center lg:flex"
            aria-label="SwiftFix home"
          >
            <Image
              src="/logo.png"
              alt="SwiftFix"
              width={120}
              height={24}
              className="h-6 w-auto"
              priority={false}
            />
          </Link>

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
                  className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300 sm:text-sm"
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
              className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300 sm:text-sm"
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
              <Image
                src={avatarUrl}
                alt="Profile avatar"
                fill
                className="object-cover"
                sizes="40px"
                priority={false}
              />
            </button>

            {profileOpen && ready && authenticated ? (
              <div className="absolute right-0 top-12 z-50 w-[min(320px,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg sm:w-[320px]">
                <div className="border-b border-zinc-200 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Profile
                  </div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">
                    {displayName}
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
