"use client";

import { useMemo } from "react";
import type { ConnectedWallet, User } from "@privy-io/react-auth";
import {
  getEmbeddedConnectedWallet,
  useActiveWallet,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";

type WalletWithOptionalType = { walletType?: string };

function isPrivyEmbeddedClientType(walletClientType: string | undefined): boolean {
  return walletClientType === "privy" || walletClientType === "privy-v2";
}

function addressFromActiveExternalWallet(
  activeWallet: ConnectedWallet | { type?: string; address?: string } | undefined,
): string | null {
  if (!activeWallet || activeWallet.type !== "ethereum") return null;
  const w = activeWallet as ConnectedWallet;
  if (!w.address || isPrivyEmbeddedClientType(w.walletClientType)) return null;
  return w.address;
}

function userHasExternalEthereumWallet(user: User | null | undefined, wallets: ConnectedWallet[]): boolean {
  if (user?.linkedAccounts?.some((a) => linkedAccountIsExternalEthereumWallet(a))) return true;
  return wallets.some(
    (w) => w.type === "ethereum" && Boolean(w.address) && !isPrivyEmbeddedClientType(w.walletClientType),
  );
}

function linkedAccountIsExternalEthereumWallet(
  a: NonNullable<User["linkedAccounts"]>[number],
): boolean {
  if (a.type !== "wallet") return false;
  if (!("address" in a) || !a.address) return false;
  const chainType = "chainType" in a ? (a as { chainType?: string }).chainType : undefined;
  if (chainType === "solana") return false;
  const wct = "walletClientType" in a ? (a as { walletClientType?: string }).walletClientType : undefined;
  return Boolean(wct && !isPrivyEmbeddedClientType(wct));
}

function firstLinkedExternalEthereumAddress(user: User | null | undefined): string | null {
  const linked = user?.linkedAccounts?.find((a) => linkedAccountIsExternalEthereumWallet(a));
  if (linked && "address" in linked && linked.address) return linked.address;
  return null;
}

export function useSmartWalletAddress() {
  const { user, ready: privyReady } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { wallet: activeWallet } = useActiveWallet();

  const hasExternalEthereumWallet = useMemo(
    () => userHasExternalEthereumWallet(user, wallets),
    [user, wallets],
  );

  const address = useMemo(() => {
    const fromActive = addressFromActiveExternalWallet(activeWallet);
    if (fromActive) return fromActive;

    const fromUserWallet =
      user?.wallet?.address &&
      user.wallet.walletClientType &&
      !isPrivyEmbeddedClientType(user.wallet.walletClientType)
        ? user.wallet.address
        : null;
    if (fromUserWallet) return fromUserWallet;

    const fromLinkedExternal = firstLinkedExternalEthereumAddress(user);
    if (fromLinkedExternal) return fromLinkedExternal;

    const externalConnected = wallets.find(
      (w) => w.type === "ethereum" && Boolean(w.address) && !isPrivyEmbeddedClientType(w.walletClientType),
    )?.address;
    if (externalConnected) return externalConnected;

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

    const fromEmbeddedUserWallet =
      user?.wallet?.address && (!user.wallet.walletClientType || isPrivyEmbeddedClientType(user.wallet.walletClientType))
        ? user.wallet.address
        : null;
    if (fromEmbeddedUserWallet) return fromEmbeddedUserWallet;

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
  }, [user, wallets, activeWallet]);

  const isLoading = !privyReady || !walletsReady;

  return { address, isLoading, hasExternalEthereumWallet };
}

export default useSmartWalletAddress;
