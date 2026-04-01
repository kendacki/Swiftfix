"use client";

import dynamic from "next/dynamic";
import React from "react";

// Dynamically import the existing Providers component and disable SSR.
// This resolves the Privy/x402 module resolution bugs on Vercel's backend.
const Providers = dynamic(
  () => import("./Providers").then((mod) => mod.Providers || mod.default),
  { ssr: false }
);

export default function ClientProviders({
  children,
  privyAppId,
}: {
  children: React.ReactNode;
  privyAppId: string;
}) {
  return <Providers privyAppId={privyAppId}>{children}</Providers>;
}
