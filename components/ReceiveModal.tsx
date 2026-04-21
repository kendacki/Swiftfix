"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { Copy, X } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useSmartWalletAddress } from "@/hooks/useSmartWalletAddress";

type ReceiveModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ReceiveModal({ open, onClose }: ReceiveModalProps) {
  const { address, isLoading } = useSmartWalletAddress();
  const { authenticated, createWallet } = usePrivy();
  const [copied, setCopied] = useState(false);
  const [creatingWallet, setCreatingWallet] = useState(false);
  const [createWalletError, setCreateWalletError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => setCopied(false));
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const qrValue = useMemo(() => address ?? "", [address]);

  if (!open) return null;

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  const handleCreateEmbeddedWallet = async () => {
    setCreateWalletError(null);
    setCreatingWallet(true);
    try {
      await createWallet();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not create a wallet. Try again or refresh the page.";
      setCreateWalletError(message);
    } finally {
      setCreatingWallet(false);
    }
  };

  const showCreateWalletCta = authenticated && !isLoading && !address;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close receive modal"
        onClick={onClose}
      />

      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight text-zinc-900">
              Receive Crypto
            </div>
            <div className="mt-1 text-xs text-zinc-600">
              Use this address to receive USDT (Privy embedded or smart wallet).
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Wallet address
            </div>
            <div className="mt-2 break-all font-mono text-xs text-zinc-900">
              {address ?? (isLoading ? "Loading address..." : "No address found.")}
            </div>
            {showCreateWalletCta ? (
              <div className="mt-3 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                <p>
                  No Ethereum wallet is linked to this login yet. Create a Privy embedded
                  wallet to get a receive address and QR code.
                </p>
                {createWalletError ? (
                  <p className="text-red-700">{createWalletError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleCreateEmbeddedWallet()}
                  disabled={creatingWallet}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {creatingWallet ? "Creating wallet…" : "Create Ethereum wallet"}
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={!address}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Copy Address"}
            </button>
          </div>

          <div className="flex items-center justify-center rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="rounded-xl bg-white p-3">
              {address ? (
                <QRCode value={qrValue} size={180} />
              ) : (
                <div className="flex h-[180px] w-[180px] items-center justify-center text-xs text-zinc-500">
                  {isLoading ? "Loading..." : "No address"}
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-zinc-600">
            You can send USDT to this exact address across Polygon, Binance Smart
            Chain (BSC), Arbitrum, or Ethereum Mainnet.
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReceiveModal;

