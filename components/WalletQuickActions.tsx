"use client";

import { useTransition } from "react";
import { ArrowDownToLine, ArrowUpRight, Copy } from "lucide-react";
import { fundWallet as fundWalletDb } from "@/actions/walletActions";
import { useFundWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import {
  POLYGON_CHAIN_ID,
  POLYGON_USDT_ADDRESS,
} from "@/lib/constants/polygon";

export function WalletQuickActions() {
  const { ready, authenticated, user } = usePrivy();
  const [isPending, startTransition] = useTransition();
  const { wallets } = useWallets();
  const { fundWallet } = useFundWallet();

  const embeddedWallet = wallets.find(
    (w) => w.walletClientType === "privy" || w.connectorType === "embedded",
  );
  const embeddedAddress = embeddedWallet?.address;

  const handleFund = (amount: number, currency: "NGN" | "USDT") => {
    if (!ready || !authenticated || !user?.id) {
      alert("Please log in to fund your wallet.");
      return;
    }

    startTransition(async () => {
      try {
        await fundWalletDb(user.id, amount, currency);
      } catch (error) {
        // For MVP, surface minimal feedback via alert.
        const message =
          error instanceof Error
            ? error.message
            : "Funding failed. Please try again.";
        alert(message);
      }
    });
  };

  const handleFundUsdt = () => {
    if (!ready || !authenticated || !embeddedAddress) {
      alert("Please log in and ensure your embedded wallet is available.");
      return;
    }

    startTransition(async () => {
      try {
        await fundWallet({
          address: embeddedAddress,
          options: {
            chain: { id: POLYGON_CHAIN_ID },
            amount: "100",
            asset: {
              erc20: POLYGON_USDT_ADDRESS,
            },
          },
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "USDT funding flow failed. Please try again.";
        alert(message);
      }
    });
  };

  const handleCopyAddress = async () => {
    if (!embeddedAddress) return;
    try {
      await navigator.clipboard.writeText(embeddedAddress);
    } catch {
      // ignore clipboard errors; address is still visible
    }
  };

  return (
    <section className="space-y-3">
      {embeddedAddress ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Your embedded wallet (Polygon)
            </div>
            <div className="mt-1 truncate font-mono text-xs text-zinc-900">
              {embeddedAddress}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleCopyAddress()}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleFund(50_000, "NGN")}
        className="group flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white">
            <ArrowDownToLine className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold tracking-tight text-zinc-900">
              Simulate NGN Deposit
            </div>
            <div className="mt-0.5 text-xs text-zinc-600">
              +₦50,000.00 into your wallet.
            </div>
          </div>
        </div>
        <ArrowUpRight className="h-5 w-5 text-zinc-400 transition group-hover:text-zinc-700" />
      </button>

      <button
        type="button"
        disabled={isPending}
        onClick={handleFundUsdt}
        className="group flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-900 p-5 shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-80"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
            <ArrowDownToLine className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold tracking-tight text-white">
              Fund USDT (Polygon)
            </div>
            <div className="mt-0.5 text-xs text-white/70">
              Buy or bridge USDT into your embedded wallet.
            </div>
          </div>
        </div>
        <ArrowUpRight className="h-5 w-5 text-white/50 transition group-hover:text-white" />
      </button>
      </div>
    </section>
  );
}

export default WalletQuickActions;

