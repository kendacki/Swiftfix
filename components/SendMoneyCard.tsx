"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Banknote, Send, Wallet } from "lucide-react";
import { sendCrypto, sendFiat } from "@/actions/transferActions";

type Tab = "FIAT" | "CRYPTO";

export function SendMoneyCard() {
  const [activeTab, setActiveTab] = useState<Tab>("FIAT");
  const [fiatAmount, setFiatAmount] = useState("");
  const [bankName, setBankName] = useState("GTBank");
  const [accountNumber, setAccountNumber] = useState("");

  const [cryptoAmount, setCryptoAmount] = useState("");
  const [network, setNetwork] = useState("TRC-20");
  const [walletAddress, setWalletAddress] = useState("");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSend = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        if (activeTab === "FIAT") {
          const amt = Number(fiatAmount);
          if (!Number.isFinite(amt) || amt <= 0) {
            setError("Enter a valid NGN amount.");
            return;
          }
          if (!accountNumber.trim()) {
            setError("Please provide an account number.");
            return;
          }
          await sendFiat("test-privy-id", amt, bankName, accountNumber.trim());
          setSuccess("NGN transfer simulated successfully.");
          setFiatAmount("");
          setAccountNumber("");
        } else {
          const amt = Number(cryptoAmount);
          if (!Number.isFinite(amt) || amt <= 0) {
            setError("Enter a valid USDT amount.");
            return;
          }
          if (!walletAddress.trim()) {
            setError("Please provide a destination address.");
            return;
          }
          await sendCrypto(
            "test-privy-id",
            amt,
            walletAddress.trim(),
            network
          );
          setSuccess("USDT transfer simulated successfully.");
          setCryptoAmount("");
          setWalletAddress("");
        }
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : "Transfer failed. Please try again.";
        setError(message);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold tracking-tight text-zinc-900">
            Send funds
          </div>
          <div className="mt-1 text-xs text-zinc-600">
            Move money to banks or external crypto wallets.
          </div>
        </div>
      </div>

      <div className="mt-4 inline-flex rounded-full border border-zinc-200 bg-zinc-50 p-1 text-xs font-semibold text-zinc-600">
        <button
          type="button"
          onClick={() => setActiveTab("FIAT")}
          className={[
            "inline-flex items-center gap-2 rounded-full px-4 py-1.5 transition",
            activeTab === "FIAT"
              ? "bg-white text-zinc-900 shadow-sm"
              : "hover:text-zinc-900",
          ].join(" ")}
        >
          <Banknote className="h-3.5 w-3.5" />
          Send NGN (Bank)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("CRYPTO")}
          className={[
            "inline-flex items-center gap-2 rounded-full px-4 py-1.5 transition",
            activeTab === "CRYPTO"
              ? "bg-white text-zinc-900 shadow-sm"
              : "hover:text-zinc-900",
          ].join(" ")}
        >
          <Wallet className="h-3.5 w-3.5" />
          Send USDT (Crypto)
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {activeTab === "FIAT" ? (
          <>
            <div>
              <label className="text-xs font-semibold text-zinc-700">
                Amount (₦)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={fiatAmount}
                onChange={(e) => setFiatAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700">
                Select bank
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="GTBank">GTBank</option>
                <option value="Moniepoint">Moniepoint</option>
                <option value="Zenith">Zenith</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700">
                Account number
              </label>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="0123456789"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-xs font-semibold text-zinc-700">
                Amount ($)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={cryptoAmount}
                onChange={(e) => setCryptoAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700">
                Network
              </label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="TRC-20">TRC-20</option>
                <option value="ERC-20">ERC-20</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700">
                Destination address
              </label>
              <input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Paste the recipient's wallet address"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
              />
              <p className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500">
                <AlertCircle className="h-3 w-3" />
                Always double-check the address before sending. Transfers are
                irreversible.
              </p>
            </div>
          </>
        )}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            {success}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSend}
          disabled={isPending}
          className={[
            "mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-zinc-200",
            isPending
              ? "cursor-not-allowed bg-zinc-200 text-zinc-500"
              : "bg-zinc-900 text-white hover:bg-zinc-800",
          ].join(" ")}
        >
          <Send className="h-4 w-4" />
          {isPending ? "Sending funds..." : "Send Funds"}
        </button>
      </div>
    </section>
  );
}

export default SendMoneyCard;

