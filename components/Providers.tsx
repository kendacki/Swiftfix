"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { AuthRedirect } from "./AuthRedirect";

type ProvidersProps = {
  children: ReactNode;
  privyAppId: string;
};

export function Providers({ children, privyAppId }: ProvidersProps) {
  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ["email", "sms"],
      }}
    >
      <AuthRedirect />
      {children}
    </PrivyProvider>
  );
}

