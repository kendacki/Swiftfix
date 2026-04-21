"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowDownToLine, ArrowUpRight, Copy } from "lucide-react";
import { fundWallet as fundWalletDb } from "@/actions/walletActions";
import { verifyPaystackDeposit } from "@/actions/paymentActions";
import { useFundWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { usePaystackPayment } from "react-paystack";
import {
  USDT_CHAIN_LABELS,
  USDT_CONTRACTS,
  USDT_CHAINS,
  type UsdtChainKey,
} from "@/lib/constants/usdt";

export function WalletQuickActions() {
  const { ready, authenticated, user } = usePrivy();
  const [isPending, startTransition] = useTransition();
  const { wallets } = useWallets();
  const { fundWallet } = useFundWallet();
  const [usdtChain, setUsdtChain] = useState<UsdtChainKey>("polygon");
  const [isVerifyingFiat, setIsVerifyingFiat] = useState(false);

  const embeddedWallet = wallets.find(
    (w) => w.walletClientType === "privy" || w.connectorType === "embedded",
  );
  const embeddedAddress = embeddedWallet?.address;
  const selectedUsdtContract = useMemo(() => USDT_CONTRACTS[usdtChain], [usdtChain]);
  const selectedChain = useMemo(() => USDT_CHAINS[usdtChain], [usdtChain]);

  const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
  const paystackEmail = user?.email?.address || "test@swiftfix.com";

  const initializePaystackPayment = usePaystackPayment({
    publicKey: paystackPublicKey,
    email: paystackEmail,
    amount: 0,
  });

  const _handleFund = (amount: number, currency: "NGN" | "USDT") => {
    if (!ready || !authenticated || !user?.id) {
      alert("Please log in to fund your wallet.");
      return;
    }

    startTransition(async () => {
      try {
        if (currency === "USDT") {
          // CRITICAL DIRECTIVE: Keep NGN fiat actions intact; do not simulate USDT via DB.
          throw new Error("USDT funding must be done on-chain.");
        }
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

  const handleFundNgnPaystack = () => {
    if (!ready || !authenticated || !user?.id) {
      alert("Please log in to fund your wallet.");
      return;
    }

    if (!paystackPublicKey.trim()) {
      alert("Paystack is not configured (NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY).");
      return;
    }

    const input = window.prompt("Enter amount to deposit (NGN):", "5000");
    if (!input) return;
    const amountNgn = Number(input);
    if (!Number.isFinite(amountNgn) || amountNgn <= 0) {
      alert("Enter a valid NGN amount.");
      return;
    }

    const amountKobo = Math.round(amountNgn * 100);
    if (amountKobo <= 0) {
      alert("Invalid amount.");
      return;
    }

    initializePaystackPayment({
      config: {
        amount: amountKobo,
        email: paystackEmail,
      },
      onSuccess: (ref: unknown) => {
        const reference =
          (ref as { reference?: string } | undefined)?.reference || "";
        if (!reference) {
          alert("Missing Paystack reference. Please contact support.");
          return;
        }

        setIsVerifyingFiat(true);
        startTransition(async () => {
          try {
            await verifyPaystackDeposit(reference, user.id);
            alert("Deposit verified and wallet credited.");
          } catch (e) {
            const message =
              e instanceof Error
                ? e.message
                : "Verification failed. Please contact support.";
            alert(message);
          } finally {
            setIsVerifyingFiat(false);
          }
        });
      },
      onClose: () => undefined,
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
            chain: { id: selectedChain.id },
            asset: {
              erc20: selectedUsdtContract,
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
              Your embedded wallet (EVM)
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
        disabled={isPending || isVerifyingFiat}
        onClick={handleFundNgnPaystack}
        className="group flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white">
            <ArrowDownToLine className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold tracking-tight text-zinc-900">
              Fund NGN (Paystack)
            </div>
            <div className="mt-0.5 text-xs text-zinc-600">
              Pay with card/bank transfer (sandbox) and verify instantly.
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
              Fund USDT
            </div>
            <div className="mt-0.5 text-xs text-white/70">
              Buy or bridge USDT into your embedded wallet on the selected network.
            </div>
          </div>
        </div>
        <ArrowUpRight className="h-5 w-5 text-white/50 transition group-hover:text-white" />
      </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            USDT network
          </div>
          <div className="mt-1 text-xs text-zinc-700">
            Choose the chain used for funding.
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
    </section>
  );
}

export default WalletQuickActions;

