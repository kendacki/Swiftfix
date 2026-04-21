"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { formatUnits } from "viem";
import { MINIMAL_ERC20_ABI } from "@/lib/constants/abi";
import {
  POLYGON_USDT_ADDRESS,
  POLYGON_USDT_DECIMALS,
} from "@/lib/constants/polygon";
import { polygonPublicClient } from "@/lib/viem/polygonClient";

type OnchainUsdtState = {
  isLoading: boolean;
  balanceRaw: bigint | null;
  balanceFormatted: string;
  address: string | null;
  error: string | null;
};

function pickEmbeddedEvmWallet(wallets: unknown[]) {
  return wallets.find((w) => {
    const wallet = w as {
      walletClientType?: string;
      connectorType?: string;
      address?: string;
    };

    if (!wallet?.address) return false;
    // Privy embedded wallets generally report walletClientType === "privy"
    if (wallet.walletClientType === "privy") return true;
    // Fallback for connector naming differences
    if (wallet.connectorType === "embedded") return true;
    return false;
  }) as { address: string } | undefined;
}

export function useOnchainUsdtBalance() {
  const { wallets } = useWallets();

  const embeddedWallet = useMemo(
    () => pickEmbeddedEvmWallet(wallets as unknown[]),
    [wallets],
  );

  const [state, setState] = useState<OnchainUsdtState>({
    isLoading: false,
    balanceRaw: null,
    balanceFormatted: "0",
    address: embeddedWallet?.address ?? null,
    error: null,
  });

  const refresh = useCallback(async () => {
    const address = embeddedWallet?.address;
    if (!address) {
      setState((s) => ({
        ...s,
        isLoading: false,
        balanceRaw: null,
        balanceFormatted: "0",
        address: null,
        error: null,
      }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, address, error: null }));
    try {
      const balance = (await polygonPublicClient.readContract({
        address: POLYGON_USDT_ADDRESS,
        abi: MINIMAL_ERC20_ABI,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      })) as bigint;

      const formatted = formatUnits(balance, POLYGON_USDT_DECIMALS);
      setState({
        isLoading: false,
        balanceRaw: balance,
        balanceFormatted: formatted,
        address,
        error: null,
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to load on-chain USDT balance.";
      setState((s) => ({
        ...s,
        isLoading: false,
        balanceRaw: null,
        balanceFormatted: "0",
        address,
        error: message,
      }));
    }
  }, [embeddedWallet?.address]);

  useEffect(() => {
    // Avoid synchronous state updates in effect body (lint rule).
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}

export default useOnchainUsdtBalance;

