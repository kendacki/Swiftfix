"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { BalanceCard } from "@/components/BalanceCard";
import WalletQuickActions from "@/components/WalletQuickActions";
import SwapCard from "@/components/SwapCard";
import SendMoneyCard from "@/components/SendMoneyCard";
import { Landmark, ShieldCheck } from "lucide-react";
import { getUserWallet } from "@/actions/walletActions";

type WalletState = {
  ngnBalance: number;
  usdtBalance: number;
} | null;

export default function WalletPage() {
  const { ready, authenticated, user } = usePrivy();
  const [wallet, setWallet] = useState<WalletState>(null);

  useEffect(() => {
    if (!ready || !authenticated || !user?.id) return;

    void (async () => {
      try {
        const data = await getUserWallet(user.id);
        setWallet({
          ngnBalance: Number(data.ngnBalance),
          usdtBalance: Number(data.usdtBalance),
        });
      } catch (error) {
        console.error("Failed to load wallet:", error);
      }
    })();
  }, [ready, authenticated, user]);

  const ngnBalance = wallet?.ngnBalance ?? 0;
  const usdtBalance = wallet?.usdtBalance ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <BalanceCard
        ngnBalance={ngnBalance}
        usdtBalance={usdtBalance}
        defaultCurrency="NGN"
      />

      <WalletQuickActions />

      <div className="grid gap-6 lg:grid-cols-2">
        <SwapCard />
        <SendMoneyCard />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-sm font-semibold tracking-tight text-zinc-900">
                Saved bank accounts
              </div>
              <div className="mt-1 text-sm text-zinc-600">
                Choose where withdrawals go.
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700">
              <ShieldCheck className="h-4 w-4" />
              Verified
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    GTBank
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-600">
                    0123456789 • John Doe
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Manage
              </button>
            </div>
          </div>

          <div className="mt-4 text-xs text-zinc-500">
            Placeholder UI — connect Paystack account resolution in Sprint 3.
          </div>
        </div>

        {/* Recent wallet activities placeholder can be wired to real data later */}
      </section>
    </div>
  );
}

