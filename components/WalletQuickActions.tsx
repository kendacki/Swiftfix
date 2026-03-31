"use client";

import { useTransition } from "react";
import { ArrowDownToLine, ArrowUpRight } from "lucide-react";
import { fundWallet } from "@/actions/walletActions";
import { usePrivy } from "@privy-io/react-auth";

export function WalletQuickActions() {
  const { ready, authenticated, user } = usePrivy();
  const [isPending, startTransition] = useTransition();

  const handleFund = (amount: number, currency: "NGN" | "USDT") => {
    if (!ready || !authenticated || !user?.id) {
      alert("Please log in to fund your wallet.");
      return;
    }

    startTransition(async () => {
      try {
        await fundWallet(user.id, amount, currency);
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

  return (
    <section className="grid gap-3 sm:grid-cols-2">
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
        onClick={() => handleFund(100, "USDT")}
        className="group flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-900 p-5 shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-80"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
            <ArrowDownToLine className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold tracking-tight text-white">
              Simulate USDT Deposit
            </div>
            <div className="mt-0.5 text-xs text-white/70">
              +100.00 USDT into your wallet.
            </div>
          </div>
        </div>
        <ArrowUpRight className="h-5 w-5 text-white/50 transition group-hover:text-white" />
      </button>
    </section>
  );
}

export default WalletQuickActions;

