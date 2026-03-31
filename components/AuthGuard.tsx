"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { syncUser } from "@/actions/authActions";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (!ready) return;

    if (!authenticated) {
      router.replace("/");
      return;
    }

    const privyId = user?.id;
    if (!privyId) return;

    const email = user.email?.address;

    void (async () => {
      try {
        await syncUser(privyId, email);
        setIsSynced(true);
      } catch (error) {
        console.error("AuthGuard syncUser error:", error);
        // Keep user on page but avoid blocking UI entirely.
        setIsSynced(true);
      }
    })();
  }, [authenticated, ready, router, user]);

  if (!ready || !authenticated || !isSynced) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-16 w-16 animate-pulse rounded-full border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl">
            <Image
              src="/logo-loader.png"
              alt="SwiftFix"
              fill
              className="object-contain drop-shadow-[0_14px_40px_rgba(255,255,255,0.18)]"
              priority
            />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthGuard;

