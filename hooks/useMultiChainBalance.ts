"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { createPublicClient, formatUnits, http } from "viem";
import { MINIMAL_ERC20_ABI } from "@/lib/constants/abi";
import {
  USDT_CHAINS,
  USDT_CHAIN_LABELS,
  USDT_CONTRACTS,
  USDT_DECIMALS,
  type UsdtChainKey,
} from "@/lib/constants/usdt";

type PerChainBalance = {
  chain: UsdtChainKey;
  chainLabel: string;
  chainId: number;
  contract: `0x${string}`;
  decimals: number;
  raw: bigint | null;
  formatted: string;
  error?: string;
};

type MultiChainBalanceState = {
  isLoading: boolean;
  address: string | null;
  perChain: PerChainBalance[];
  totalRaw6: bigint;
  totalFormatted: string;
  totalUSDT: number;
  balancesByChain: Record<number, number>;
  error: string | null;
};

function pickEmbeddedEvmWallet(wallets: unknown[]) {
  const smart = wallets.find((w) => {
    const wallet = w as { walletType?: string; address?: string };
    return wallet?.address && wallet.walletType === "smart_wallet";
  }) as { address: string } | undefined;

  if (smart) return smart;

  return wallets.find((w) => {
    const wallet = w as {
      walletClientType?: string;
      connectorType?: string;
      address?: string;
    };

    if (!wallet?.address) return false;
    if (wallet.walletClientType === "privy") return true;
    if (wallet.connectorType === "embedded") return true;
    return false;
  }) as { address: string } | undefined;
}

function normalizeTo6Decimals(value: bigint, decimals: number): bigint {
  if (decimals === 6) return value;
  if (decimals > 6) {
    const divisor = BigInt(10) ** BigInt(decimals - 6);
    return value / divisor;
  }
  const mul = BigInt(10) ** BigInt(6 - decimals);
  return value * mul;
}

export function useMultiChainBalance() {
  const { wallets } = useWallets();

  const embeddedWallet = useMemo(
    () => pickEmbeddedEvmWallet(wallets as unknown[]),
    [wallets],
  );

  const [state, setState] = useState<MultiChainBalanceState>({
    isLoading: false,
    address: embeddedWallet?.address ?? null,
    perChain: [],
    totalRaw6: BigInt(0),
    totalFormatted: "0",
    totalUSDT: 0,
    balancesByChain: {},
    error: null,
  });

  const refresh = useCallback(async () => {
    const address = embeddedWallet?.address;
    if (!address) {
      setState({
        isLoading: false,
        address: null,
        perChain: [],
        totalRaw6: BigInt(0),
        totalFormatted: "0",
        totalUSDT: 0,
        balancesByChain: {},
        error: null,
      });
      return;
    }

    setState((s) => ({ ...s, isLoading: true, address, error: null }));

    const keys = Object.keys(USDT_CHAINS) as UsdtChainKey[];
    const results: PerChainBalance[] = [];
    let total6 = BigInt(0);
    const byChainId: Record<number, number> = {};

    await Promise.all(
      keys.map(async (key) => {
        const chain = USDT_CHAINS[key];
        const contract = USDT_CONTRACTS[key];
        const decimals = USDT_DECIMALS[key];
        const chainLabel = USDT_CHAIN_LABELS[key];
        try {
          const client = createPublicClient({
            chain,
            transport: http(chain.rpcUrls.default.http[0]),
          });

          const raw = (await client.readContract({
            address: contract,
            abi: MINIMAL_ERC20_ABI,
            functionName: "balanceOf",
            args: [address as `0x${string}`],
          })) as bigint;

          const formatted = formatUnits(raw, decimals);
          total6 += normalizeTo6Decimals(raw, decimals);
          byChainId[chain.id] = Number(formatted || 0);

          results.push({
            chain: key,
            chainLabel,
            chainId: chain.id,
            contract,
            decimals,
            raw,
            formatted,
          });
        } catch (e) {
          const message =
            e instanceof Error
              ? e.message
              : `Failed to read ${chainLabel} USDT balance.`;
          byChainId[chain.id] = 0;
          results.push({
            chain: key,
            chainLabel,
            chainId: chain.id,
            contract,
            decimals,
            raw: null,
            formatted: "0",
            error: message,
          });
        }
      }),
    );

    // Keep output stable order for UI.
    results.sort((a, b) => a.chainLabel.localeCompare(b.chainLabel));

    setState({
      isLoading: false,
      address,
      perChain: results,
      totalRaw6: total6,
      totalFormatted: formatUnits(total6, 6),
      totalUSDT: Number(formatUnits(total6, 6) || 0),
      balancesByChain: byChainId,
      error: null,
    });
  }, [embeddedWallet?.address]);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  return { ...state, refresh };
}

export default useMultiChainBalance;

