"use client";

import { useSyncExternalStore } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { AuthRedirect } from "./AuthRedirect";

type ProvidersProps = {
  children: ReactNode;
};

const emptySubscribe = () => () => {};

export function Providers({ children }: ProvidersProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        loginMethods: ["email", "wallet", "sms"],
      }}
    >
      <AuthRedirect />
      {children}
    </PrivyProvider>
  );
}

