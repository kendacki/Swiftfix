"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { BalanceCard } from "@/components/BalanceCard";
import { getUserWallet } from "@/actions/walletActions";
import { getUserTransactions } from "@/actions/transactionActions";
import {
  ArrowDownLeft,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { Transaction } from "@prisma/client";

type WalletSummary = {
  ngnBalance: number;
  usdtBalance: number;
} | null;

function formatTxDate(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatTxAmount(currency: string, amount: unknown) {
  const raw = typeof amount === "string" ? amount : String(amount);
  const value = Number(raw);
  const safe = Number.isFinite(value) ? value : 0;

  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);

  if (currency === "NGN") return `₦${formatted}`;
  if (currency === "USDT") return `${formatted} USDT`;
  return `${formatted} ${currency}`;
}

export default function DashboardPage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletSummary>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!ready || !authenticated || !user?.id) return;

    void (async () => {
      try {
        const [w, tx] = await Promise.all([
          getUserWallet(user.id),
          getUserTransactions(user.id),
        ]);

        setWallet({
          ngnBalance: Number(w.ngnBalance),
          usdtBalance: Number(w.usdtBalance),
        });
        setTransactions(tx.slice(0, 4));
      } catch (error) {
        console.error("Dashboard data load failed:", error);
      }
    })();
  }, [ready, authenticated, user]);

  const displayName = useMemo(
    () => user?.email?.address ?? user?.id ?? "there",
    [user]
  );

  const totalNgn = wallet?.ngnBalance ?? 0;
  const totalUsdt = wallet?.usdtBalance ?? 0;

  if (!ready || !authenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-16 w-16 animate-pulse rounded-full border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl">
            <Image
              src="/logo-loader.png"
              alt="SwiftFix"
              fill
              className="object-contain drop-shadow-[0_14px_40px_rgba(255,255,255,0.18)]"
              priority
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Section 1: Welcome & Balances */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Overview
            </div>
            <div className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              Welcome back, {displayName}
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              Here&apos;s a Summary of your Portfolio.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <BalanceCard
            ngnBalance={totalNgn}
            usdtBalance={totalUsdt}
            defaultCurrency="NGN"
          />
        </div>
      </section>

      {/* Section 2: Quick Actions */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight text-zinc-900">
              Quick actions
            </div>
            <div className="mt-1 text-sm text-zinc-600">
              Move capital where it matters in two taps.
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => router.push("/request")}
            className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight text-zinc-900">
                Find an Artisan
              </div>
              <div className="mt-0.5 text-xs text-zinc-600">
                Describe the job and match instantly.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push("/wallet")}
            className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight text-zinc-900">
                Swap Crypto
              </div>
              <div className="mt-0.5 text-xs text-zinc-600">
                Convert USDT to NGN at live rates.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push("/wallet")}
            className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight text-zinc-900">
                Fund Wallet
              </div>
              <div className="mt-0.5 text-xs text-zinc-600">
                Add NGN or USDT to stay ready.
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Section 3: Recent Activity */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight text-zinc-900">
              Recent activity
            </div>
            <div className="mt-1 text-sm text-zinc-600">
              A quick view of your latest moves.
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/transactions")}
            className="hidden rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 sm:inline-flex"
          >
            View all
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200">
          {transactions.length === 0 ? (
            <div className="flex items-center justify-between gap-3 px-4 py-4 text-sm text-zinc-600">
              <div>No activity yet. Once you fund, swap, or pay, it will appear here.</div>
              <button
                type="button"
                onClick={() => router.push("/wallet")}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
              >
                Fund wallet
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {tx.type.toLowerCase()}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {formatTxAmount(
                        tx.currency,
                        tx.amount?.toString?.() ?? tx.amount
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-xs sm:table-cell">
                      <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {formatTxDate(tx.createdAt as unknown as Date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push("/transactions")}
          className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 sm:hidden"
        >
          View all activity
        </button>
      </section>
    </div>
  );
}


