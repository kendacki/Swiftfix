"use client";

import { useMemo } from "react";
import { useWallets } from "@privy-io/react-auth";

export function useSmartWalletAddress() {
  const { wallets } = useWallets();

  return useMemo(() => {
    const smartPrivy = wallets.find((w) => {
      const walletType = (w as unknown as { walletType?: string }).walletType;
      return w.walletClientType === "privy" && walletType === "smart_wallet";
    });
    if (smartPrivy?.address) return smartPrivy.address;

    const anySmart = wallets.find((w) => {
      const walletType = (w as unknown as { walletType?: string }).walletType;
      return walletType === "smart_wallet";
    });
    if (anySmart?.address) return anySmart.address;

    const anyPrivy = wallets.find((w) => w.walletClientType === "privy");
    if (anyPrivy?.address) return anyPrivy.address;

    return wallets.find((w) => Boolean(w.address))?.address ?? null;
  }, [wallets]);
}

export default useSmartWalletAddress;

