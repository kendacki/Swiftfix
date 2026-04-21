"use client";

import { useState, useTransition } from "react";
import { ArrowDownToLine, ArrowUpRight, Copy } from "lucide-react";
import { verifyPaystackDeposit } from "@/actions/paymentActions";
import { usePrivy } from "@privy-io/react-auth";
import { usePaystackPayment } from "react-paystack";
import { ReceiveModal } from "@/components/ReceiveModal";
import { useSmartWalletAddress } from "@/hooks/useSmartWalletAddress";

function resolvePaystackEmail(
  user: ReturnType<typeof usePrivy>["user"],
): string {
  const direct = user?.email?.address?.trim();
  if (direct) return direct;
  const linked = user?.linkedAccounts?.find((a) => a.type === "email") as
    | { address?: string }
    | undefined;
  if (linked?.address?.trim()) return linked.address.trim();
  const fallback = process.env.NEXT_PUBLIC_PAYSTACK_FALLBACK_EMAIL?.trim();
  if (fallback) return fallback;
  if (user?.phone?.number) {
    const safe = user.phone.number.replace(/[^\d+]/g, "").slice(0, 24) || "user";
    return `sms+${safe}@swiftfix.com`;
  }
  const idPart = user?.id?.replace(/[^a-zA-Z0-9]/g, "").slice(-28) || "guest";
  return `wallet+${idPart}@swiftfix.com`;
}

export function WalletQuickActions() {
  const { ready, authenticated, user } = usePrivy();
  const [isPending, startTransition] = useTransition();
  const [isVerifyingFiat, setIsVerifyingFiat] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);

  const { address: receiveAddress, hasExternalEthereumWallet } = useSmartWalletAddress();

  const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
  const paystackEmail = resolvePaystackEmail(user);

  const initializePaystackPayment = usePaystackPayment({
    publicKey: paystackPublicKey,
    email: paystackEmail,
    amount: 0,
  });

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
        channels: ["card", "bank_transfer", "bank"],
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

  const handleCopyAddress = async () => {
    const toCopy = receiveAddress;
    if (!toCopy) return;
    try {
      await navigator.clipboard.writeText(toCopy);
    } catch {
      // ignore clipboard errors; address is still visible
    }
  };

  return (
    <section className="space-y-3">
      <ReceiveModal open={receiveOpen} onClose={() => setReceiveOpen(false)} />
      {receiveAddress ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {hasExternalEthereumWallet
                ? "Your connected wallet (EVM)"
                : user?.smartWallet?.address === receiveAddress
                  ? "Your smart wallet (EVM)"
                  : "Your Privy wallet (EVM)"}
            </div>
            <div className="mt-1 truncate font-mono text-xs text-zinc-900">
              {receiveAddress}
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
        onClick={() => setReceiveOpen(true)}
        className="group flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-900 p-5 shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-80"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
            <ArrowDownToLine className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold tracking-tight text-white">
              Receive Crypto
            </div>
            <div className="mt-0.5 text-xs text-white/70">Show address + QR code.</div>
          </div>
        </div>
        <ArrowUpRight className="h-5 w-5 text-white/50 transition group-hover:text-white" />
      </button>
      </div>
    </section>
  );
}

export default WalletQuickActions;

