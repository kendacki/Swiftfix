"use client";

import { useMemo } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

type WalletWithOptionalType = { walletType?: string };

export function useSmartWalletAddress() {
  const { user, ready: privyReady } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  const address = useMemo(() => {
    const fromUser = user?.smartWallet?.address || user?.wallet?.address;
    if (fromUser) return fromUser;

    const smartLinked = user?.linkedAccounts?.find((a) => a.type === "smart_wallet");
    if (smartLinked?.address) return smartLinked.address;

    const smartWallet = wallets.find((w) => {
      const walletType = (w as WalletWithOptionalType).walletType;
      return walletType === "smart_wallet";
    })?.address;
    if (smartWallet) return smartWallet;

    const smartPrivy = wallets.find((w) => {
      const walletType = (w as WalletWithOptionalType).walletType;
      return w.walletClientType === "privy" && walletType === "smart_wallet";
    })?.address;
    if (smartPrivy) return smartPrivy;

    const anyPrivy = wallets.find((w) => w.walletClientType === "privy")?.address;
    if (anyPrivy) return anyPrivy;

    return wallets.find((w) => Boolean(w.address))?.address ?? null;
  }, [user, wallets]);

  // Privy can report `ready` before `useWallets()` has hydrated; wait for both
  // so we do not flash "No address found" while wallets are still loading.
  const isLoading = !privyReady || !walletsReady;

  return { address, isLoading };
}

export default useSmartWalletAddress;

