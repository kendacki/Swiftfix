"use client";

import { useMemo } from "react";
import {
  getEmbeddedConnectedWallet,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";

type WalletWithOptionalType = { walletType?: string };

export function useSmartWalletAddress() {
  const { user, ready: privyReady } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  const address = useMemo(() => {
    const fromUserSmart = user?.smartWallet?.address;
    if (fromUserSmart) return fromUserSmart;

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

    const fromUserWallet = user?.wallet?.address;
    if (fromUserWallet) return fromUserWallet;

    const linkedEth = user?.linkedAccounts?.find((a) => {
      if (a.type !== "wallet") return false;
      if (!("address" in a) || !a.address) return false;
      const chainType = "chainType" in a ? (a as { chainType?: string }).chainType : undefined;
      if (chainType === "solana") return false;
      return true;
    });
    if (linkedEth && "address" in linkedEth && linkedEth.address) return linkedEth.address;

    const embedded = getEmbeddedConnectedWallet(wallets)?.address;
    if (embedded) return embedded;

    const anyPrivyEth = wallets.find(
      (w) => w.type === "ethereum" && w.walletClientType === "privy",
    )?.address;
    if (anyPrivyEth) return anyPrivyEth;

    return wallets.find((w) => w.type === "ethereum" && Boolean(w.address))?.address ?? null;
  }, [user, wallets]);

  // Privy can report `ready` before `useWallets()` has hydrated; wait for both
  // so we do not flash "No address found" while wallets are still loading.
  const isLoading = !privyReady || !walletsReady;

  return { address, isLoading };
}

export default useSmartWalletAddress;
