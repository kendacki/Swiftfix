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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-14 w-14 animate-pulse">
            <Image
              src="/logo.png"
              alt="SwiftFix"
              fill
              className="object-contain"
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

