import type { Chain } from "viem/chains";
import { arbitrum, bsc, mainnet, polygon } from "viem/chains";

export type UsdtChainKey = "polygon" | "bsc" | "mainnet" | "arbitrum";

export const USDT_CHAINS: Record<UsdtChainKey, Chain> = {
  polygon,
  bsc,
  mainnet,
  arbitrum,
};

export const USDT_CONTRACTS: Record<UsdtChainKey, `0x${string}`> = {
  // Polygon USDT
  polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  // BSC USDT
  bsc: "0x55d398326f99059ff775485246999027b3197955",
  // Ethereum USDT
  mainnet: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  // Arbitrum USDT
  arbitrum: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
};

export const USDT_DECIMALS: Record<UsdtChainKey, number> = {
  polygon: 6,
  // NOTE: BSC's USDT is commonly treated as 18 decimals.
  bsc: 18,
  mainnet: 6,
  arbitrum: 6,
};

export const USDT_CHAIN_LABELS: Record<UsdtChainKey, string> = {
  polygon: "Polygon",
  bsc: "BSC",
  mainnet: "Ethereum",
  arbitrum: "Arbitrum",
};

export const NATIVE_GAS_LABELS: Record<UsdtChainKey, string> = {
  polygon: "MATIC",
  bsc: "BNB",
  mainnet: "ETH",
  arbitrum: "ETH",
};

// Placeholder treasury wallet for hybrid swaps (USDT -> NGN).
// Replace with your custody/treasury address.
export const TREASURY_WALLET_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;

