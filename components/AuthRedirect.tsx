"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthRedirect() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();

  useEffect(() => {
    if (ready && authenticated) {
      router.push("/dashboard");
    }
  }, [authenticated, ready, router]);

  return null;
}

