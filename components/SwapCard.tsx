"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowDownUp, RefreshCw, Wallet } from "lucide-react";
import { executeSwap, getLiveSwapRate } from "@/actions/swapActions";
import { usePrivy } from "@privy-io/react-auth";

type SwapRateState = {
  rate: number;
  quoteId: string;
  expiresAt: number;
};

export function SwapCard() {
  const { ready, authenticated, user } = usePrivy();
  const [rateState, setRateState] = useState<SwapRateState | null>(null);
  const [isRefreshingRate, setIsRefreshingRate] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const numericPayAmount = useMemo(() => {
    const n = Number(payAmount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [payAmount]);

  const receiveAmount = useMemo(() => {
    if (!rateState) return 0;
    return numericPayAmount * rateState.rate;
  }, [numericPayAmount, rateState]);

  const formattedReceive = useMemo(
    () =>
      receiveAmount
        ? new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2,
          }).format(receiveAmount)
        : "₦0.00",
    [receiveAmount]
  );

  const formattedRate = useMemo(
    () =>
      rateState
        ? new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2,
          }).format(rateState.rate)
        : "—",
    [rateState]
  );

  const loadRate = async () => {
    setIsRefreshingRate(true);
    setError(null);
    try {
      const data = await getLiveSwapRate();
      setRateState(data);
    } catch {
      setError("Unable to fetch live rate. Using the last known value.");
    } finally {
      setIsRefreshingRate(false);
    }
  };

  useEffect(() => {
    void loadRate();
  }, []);

  const onConfirmSwap = () => {
    if (!ready || !authenticated || !user?.id) {
      setError("Please log in before swapping.");
      return;
    }

    if (!rateState || numericPayAmount <= 0) {
      setError("Enter a valid USDT amount before swapping.");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        await executeSwap(
          user.id,
          "USDT",
          "NGN",
          numericPayAmount,
          rateState.rate
        );
        setPayAmount("");
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Swap failed. Please try again.";
        setError(message);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold tracking-tight text-zinc-900">
            Swap
          </div>
          <div className="mt-1 text-xs text-zinc-600">
            Convert USDT to NGN with a live CoinGecko rate.
          </div>
        </div>

        <button
          type="button"
          onClick={loadRate}
          disabled={isRefreshingRate}
          className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        >
          <RefreshCw
            className={[
              "h-4 w-4",
              isRefreshingRate ? "animate-spin" : "",
            ].join(" ")}
          />
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
            <span>You pay</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-800">
              <Wallet className="h-3 w-3" />
              USDT
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <input
              type="number"
              min={0}
              step="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-2xl font-semibold tracking-tight text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800">
            <ArrowDownUp className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
            <span>You receive</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-800">
              NGN
            </span>
          </div>
          <div className="text-2xl font-semibold tracking-tight text-zinc-900">
            {formattedReceive}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            Rate:{" "}
            <span className="font-semibold text-zinc-800">
              1 USDT = {formattedRate}
            </span>
          </span>
          {rateState ? (
            <span>
              Quote ID:{" "}
              <span className="font-mono text-[11px] text-zinc-400">
                {rateState.quoteId}
              </span>
            </span>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onConfirmSwap}
          disabled={isPending || !rateState || numericPayAmount <= 0}
          className={[
            "mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-zinc-200",
            isPending || !rateState || numericPayAmount <= 0
              ? "cursor-not-allowed bg-zinc-200 text-zinc-500"
              : "bg-zinc-900 text-white hover:bg-zinc-800",
          ].join(" ")}
        >
          {isPending ? "Confirming swap..." : "Confirm Swap"}
        </button>
      </div>
    </section>
  );
}

export default SwapCard;

