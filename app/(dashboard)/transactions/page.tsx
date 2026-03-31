"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { getUserTransactions } from "@/actions/transactionActions";
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Search } from "lucide-react";
import type { Transaction } from "@prisma/client";

function formatTxDate(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

  if (currency === "NGN") return `₦${formatted} NGN`;
  if (currency === "USDT") return `${formatted} USDT`;
  return `${formatted} ${currency}`;
}

export default function TransactionsPage() {
  const { ready, authenticated, user } = usePrivy();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!ready || !authenticated || !user?.id) return;

    void (async () => {
      try {
        const data = await getUserTransactions(user.id);
        setTransactions(data);
      } catch (error) {
        console.error("Failed to load transactions:", error);
      }
    })();
  }, [ready, authenticated, user]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500">
            View and manage your recent financial activity.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-black md:w-64"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gray-100 bg-gray-50">
              <RefreshCw className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-gray-900">
              No transactions yet
            </h3>
            <p className="max-w-sm text-gray-500">
              Your transaction history is currently empty. Once you fund your
              wallet, swap, or pay an artisan, your activity will securely
              appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={[
                            "rounded-full p-2",
                            tx.type === "DEPOSIT"
                              ? "bg-green-100 text-green-600"
                              : tx.type === "WITHDRAWAL"
                                ? "bg-red-100 text-red-600"
                                : "bg-blue-100 text-blue-600",
                          ].join(" ")}
                        >
                          {tx.type === "DEPOSIT" && (
                            <ArrowDownLeft className="h-4 w-4" />
                          )}
                          {tx.type === "WITHDRAWAL" && (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                          {(tx.type === "SWAP" || tx.type === "PAYMENT") && (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </div>
                        <span className="font-medium capitalize text-gray-900">
                          {tx.type.toLowerCase()}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {formatTxDate(tx.createdAt as unknown as Date)}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">
                        {formatTxAmount(
                          tx.currency,
                          tx.amount?.toString?.() ?? tx.amount
                        )}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={[
                          "rounded-full border px-2.5 py-1 text-xs font-medium",
                          tx.status === "COMPLETED"
                            ? "border-green-200 bg-green-100 text-green-700"
                            : tx.status === "PENDING"
                              ? "border-yellow-200 bg-yellow-100 text-yellow-700"
                              : "border-red-200 bg-red-100 text-red-700",
                        ].join(" ")}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
