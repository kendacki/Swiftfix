"use client";

import { usePrivy } from "@privy-io/react-auth";

export function useSmartWalletAddress() {
  const { user, ready } = usePrivy();
  const address = user?.smartWallet?.address || user?.wallet?.address || null;
  return { address, isLoading: !ready };
}

export default useSmartWalletAddress;

