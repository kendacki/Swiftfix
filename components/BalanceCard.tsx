"use client";

import { Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";

type Currency = "NGN" | "USDT";

type BalanceCardProps = {
  ngnBalance: number;
  usdtBalance: number;
  usdtNgnEquivalent?: number;
  isUsdtLive?: boolean;
  defaultCurrency?: Currency;
};

function formatMoney(currency: Currency, value: number) {
  if (currency === "USDT") {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function BalanceCard({
  ngnBalance,
  usdtBalance,
  usdtNgnEquivalent,
  isUsdtLive = false,
  defaultCurrency = "NGN",
}: BalanceCardProps) {
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [visible, setVisible] = useState(true);

  const activeValue = currency === "NGN" ? ngnBalance : usdtBalance;

  const displayValue = useMemo(() => {
    const formatted =
      currency === "NGN"
        ? formatMoney(currency, activeValue)
        : `${formatMoney(currency, activeValue)} USDT`;

    return visible ? formatted : "••••••••";
  }, [activeValue, currency, visible]);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_15%_10%,rgba(24,24,27,0.10),transparent_55%),radial-gradient(700px_240px_at_80%_0%,rgba(37,99,235,0.12),transparent_55%)]"
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Total balance
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                {displayValue}
              </div>
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                aria-label={visible ? "Hide balance" : "Show balance"}
              >
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-2 text-sm text-zinc-600">
              Switch between your NGN and USDT balance.
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setCurrency("NGN")}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                currency === "NGN"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:text-zinc-900",
              ].join(" ")}
            >
              NGN
            </button>
            <button
              type="button"
              onClick={() => setCurrency("USDT")}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                currency === "USDT"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:text-zinc-900",
              ].join(" ")}
            >
              USDT
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              NGN balance
            </div>
            <div className="mt-2 text-sm font-semibold text-zinc-900">
              {visible ? formatMoney("NGN", ngnBalance) : "••••••••"}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              <span>USDT balance</span>
              {isUsdtLive ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold tracking-normal text-emerald-800">
                  On-chain
                </span>
              ) : null}
            </div>
            <div className="mt-2 text-sm font-semibold text-zinc-900">
              {visible ? `${formatMoney("USDT", usdtBalance)} USDT` : "••••••••"}
            </div>
            {typeof usdtNgnEquivalent === "number" ? (
              <div className="mt-1 text-xs text-zinc-600">
                ≈{" "}
                {visible ? formatMoney("NGN", usdtNgnEquivalent) : "••••••••"} NGN
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

