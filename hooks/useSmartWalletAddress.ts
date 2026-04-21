"use client";

import { useMemo } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

export function useSmartWalletAddress() {
  const { user, ready } = usePrivy();
  const { wallets } = useWallets();

  const address = useMemo(() => {
    const fromUser = user?.smartWallet?.address || user?.wallet?.address;
    if (fromUser) return fromUser;

    const smartFromWallets = wallets.find((w) => {
      const walletType = (w as unknown as { walletType?: string }).walletType;
      return w.walletClientType === "privy" && walletType === "smart_wallet";
    })?.address;
    if (smartFromWallets) return smartFromWallets;

    const anyPrivy = wallets.find((w) => w.walletClientType === "privy")?.address;
    if (anyPrivy) return anyPrivy;

    return wallets.find((w) => Boolean(w.address))?.address ?? null;
  }, [user, wallets]);

  return { address, isLoading: !ready };
}

export default useSmartWalletAddress;

