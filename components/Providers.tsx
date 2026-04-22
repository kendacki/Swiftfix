"use client";

import { useSyncExternalStore } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import type { ReactNode } from "react";
import { AuthRedirect } from "./AuthRedirect";
import { arbitrum, bsc, mainnet, polygon } from "viem/chains";

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

  const privyConfig = {
    loginMethods: ["email", "wallet", "sms"],
    appearance: {
      showWalletLoginFirst: false,
    },
    // NOTE: Some versions of `@privy-io/react-auth` may not yet include this in TS types.
    smartWallets: {
      createOnLogin: "all-users",
      requireUserPasswordOnCreate: false,
    },
    supportedChains: [mainnet, bsc, polygon, arbitrum],
    defaultChain: polygon,
  } as unknown as Parameters<typeof PrivyProvider>[0]["config"];

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={privyConfig}
    >
      <SmartWalletsProvider>
        <AuthRedirect />
        {children}
      </SmartWalletsProvider>
    </PrivyProvider>
  );
}

