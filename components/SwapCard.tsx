"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowDownUp, RefreshCw, Wallet } from "lucide-react";
import {
  debitNgnForUsdtSwapMock,
  getLiveSwapRate,
  verifyAndCreditNgnSwap,
} from "@/actions/swapActions";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  createWalletClient,
  createPublicClient,
  custom,
  encodeFunctionData,
  parseUnits,
  http,
} from "viem";
import { MINIMAL_ERC20_ABI } from "@/lib/constants/abi";
import {
  NATIVE_GAS_LABELS,
  TREASURY_WALLET_ADDRESS,
  USDT_CHAIN_LABELS,
  USDT_CHAINS,
  USDT_CONTRACTS,
  USDT_DECIMALS,
  type UsdtChainKey,
} from "@/lib/constants/usdt";

type SwapRateState = {
  rate: number;
  quoteId: string;
  expiresAt: number;
};

type SwapDirection = "USDT_TO_NGN" | "NGN_TO_USDT";

export function SwapCard() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [rateState, setRateState] = useState<SwapRateState | null>(null);
  const [isRefreshingRate, setIsRefreshingRate] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [direction, setDirection] = useState<SwapDirection>("USDT_TO_NGN");
  const [usdtChain, setUsdtChain] = useState<UsdtChainKey>("polygon");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isConfirmingOnchain, setIsConfirmingOnchain] = useState(false);

  const embeddedWallet = useMemo(
    () =>
      wallets.find(
        (w) => w.walletClientType === "privy" || w.connectorType === "embedded",
      ),
    [wallets],
  );

  const numericPayAmount = useMemo(() => {
    const n = Number(payAmount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [payAmount]);

  const receiveAmount = useMemo(() => {
    if (!rateState) return 0;
    if (direction === "USDT_TO_NGN") {
      return numericPayAmount * rateState.rate;
    }
    return numericPayAmount / rateState.rate;
  }, [direction, numericPayAmount, rateState]);

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
      setError(
        direction === "USDT_TO_NGN"
          ? "Enter a valid USDT amount before swapping."
          : "Enter a valid NGN amount before swapping.",
      );
      return;
    }

    setError(null);
    setTxHash(null);

    startTransition(async () => {
      try {
        if (direction === "USDT_TO_NGN") {
          if (!embeddedWallet) {
            throw new Error(
              "Embedded wallet not available. Please reconnect and try again.",
            );
          }

          // Step 1: On-chain ERC20 transfer of USDT -> Treasury wallet.
          const chain = USDT_CHAINS[usdtChain];
          const decimals = USDT_DECIMALS[usdtChain];
          const usdtContract = USDT_CONTRACTS[usdtChain];
          const amount = parseUnits(
            numericPayAmount.toString(),
            decimals,
          );
          const data = encodeFunctionData({
            abi: MINIMAL_ERC20_ABI,
            functionName: "transfer",
            args: [TREASURY_WALLET_ADDRESS, amount],
          });

          await embeddedWallet.switchChain(chain.id);
          const provider = await embeddedWallet.getEthereumProvider();
          const walletClient = createWalletClient({
            chain,
            transport: custom(provider),
          });

          const hash = await walletClient.sendTransaction({
            account: embeddedWallet.address as `0x${string}`,
            to: usdtContract,
            data,
            value: BigInt(0),
          });
          setTxHash(hash);

          setIsConfirmingOnchain(true);
          const publicClient = createPublicClient({
            chain,
            transport: http(chain.rpcUrls.default.http[0]),
          });
          await publicClient.waitForTransactionReceipt({
            hash: hash as `0x${string}`,
            confirmations: 1,
          });
          setIsConfirmingOnchain(false);

          // Step 2: Credit NGN in DB after transfer.
          await verifyAndCreditNgnSwap(hash, user.id, numericPayAmount);
          setPayAmount("");
        } else {
          await debitNgnForUsdtSwapMock(user.id, numericPayAmount, rateState.rate);
          setPayAmount("");
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Swap failed. Please try again.";
        const normalized = message.toLowerCase();
        if (
          normalized.includes("insufficient funds") ||
          normalized.includes("gas")
        ) {
          setError(
            `Insufficient Gas (${NATIVE_GAS_LABELS[usdtChain]}). You need a small amount of ${NATIVE_GAS_LABELS[usdtChain]} on ${USDT_CHAIN_LABELS[usdtChain]} to pay the network fee.`,
          );
        } else {
          setError(message);
        }
      } finally {
        setIsConfirmingOnchain(false);
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
        <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 p-1 text-xs font-semibold text-zinc-600">
          <button
            type="button"
            onClick={() => setDirection("USDT_TO_NGN")}
            className={[
              "rounded-full px-4 py-1.5 transition",
              direction === "USDT_TO_NGN"
                ? "bg-white text-zinc-900 shadow-sm"
                : "hover:text-zinc-900",
            ].join(" ")}
          >
            USDT → NGN
          </button>
          <button
            type="button"
            onClick={() => setDirection("NGN_TO_USDT")}
            className={[
              "rounded-full px-4 py-1.5 transition",
              direction === "NGN_TO_USDT"
                ? "bg-white text-zinc-900 shadow-sm"
                : "hover:text-zinc-900",
            ].join(" ")}
          >
            NGN → USDT
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              USDT source chain
            </div>
            <div className="mt-1 text-xs text-zinc-600">
              Select the network you are swapping USDT from.
            </div>
          </div>
          <select
            value={usdtChain}
            onChange={(e) => setUsdtChain(e.target.value as UsdtChainKey)}
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
          >
            <option value="polygon">{USDT_CHAIN_LABELS.polygon}</option>
            <option value="bsc">{USDT_CHAIN_LABELS.bsc}</option>
            <option value="mainnet">{USDT_CHAIN_LABELS.mainnet}</option>
            <option value="arbitrum">{USDT_CHAIN_LABELS.arbitrum}</option>
          </select>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
            <span>You pay</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-800">
              <Wallet className="h-3 w-3" />
              {direction === "USDT_TO_NGN" ? "USDT" : "NGN"}
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
              {direction === "USDT_TO_NGN" ? "NGN" : "USDT"}
            </span>
          </div>
          <div className="text-2xl font-semibold tracking-tight text-zinc-900">
            {direction === "USDT_TO_NGN"
              ? formattedReceive
              : receiveAmount
                ? `${new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  }).format(receiveAmount)} USDT`
                : "0 USDT"}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            Rate:{" "}
            <span className="font-semibold text-zinc-800">
              1 USDT = {formattedRate}
            </span>
          </span>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {error}
          </div>
        ) : null}

        {txHash ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
            <div className="font-semibold text-zinc-900">On-chain transfer</div>
            <div className="mt-1 break-all font-mono text-[11px] text-zinc-600">
              {txHash}
            </div>
            {isConfirmingOnchain ? (
              <div className="mt-2 text-xs text-zinc-600">
                Waiting for Polygon confirmation…
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onConfirmSwap}
          disabled={
            isPending ||
            isConfirmingOnchain ||
            !rateState ||
            numericPayAmount <= 0
          }
          className={[
            "mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-zinc-200",
            isPending ||
            isConfirmingOnchain ||
            !rateState ||
            numericPayAmount <= 0
              ? "cursor-not-allowed bg-zinc-200 text-zinc-500"
              : "bg-zinc-900 text-white hover:bg-zinc-800",
          ].join(" ")}
        >
          {isConfirmingOnchain
            ? "Confirming on-chain..."
            : isPending
              ? "Confirming swap..."
              : "Confirm Swap"}
        </button>
      </div>
    </section>
  );
}

export default SwapCard;

