"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertCircle, Banknote, Send, Wallet } from "lucide-react";
import { sendFiat } from "@/actions/transferActions";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  createWalletClient,
  custom,
  encodeFunctionData,
  parseUnits,
} from "viem";
import { polygon } from "viem/chains";
import { MINIMAL_ERC20_ABI } from "@/lib/constants/abi";
import {
  POLYGON_CHAIN_ID,
  POLYGON_USDT_ADDRESS,
  POLYGON_USDT_DECIMALS,
} from "@/lib/constants/polygon";
import { polygonPublicClient } from "@/lib/viem/polygonClient";

type Tab = "FIAT" | "CRYPTO";

const BANKS = [
  { name: "GTBank", code: "058" },
  { name: "Access Bank", code: "044" },
  { name: "First Bank", code: "011" },
  { name: "Zenith Bank", code: "057" },
] as const;

export function SendMoneyCard() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [activeTab, setActiveTab] = useState<Tab>("FIAT");
  const [fiatAmount, setFiatAmount] = useState("");
  const [bankCode, setBankCode] = useState<(typeof BANKS)[number]["code"]>("058");
  const [accountNumber, setAccountNumber] = useState("");

  const [cryptoAmount, setCryptoAmount] = useState("");
  const [network] = useState("Polygon");
  const [walletAddress, setWalletAddress] = useState("");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const embeddedWallet = useMemo(
    () =>
      wallets.find(
        (w) => w.walletClientType === "privy" || w.connectorType === "embedded",
      ),
    [wallets],
  );

  const handleSend = () => {
    setError(null);
    setSuccess(null);
    setTxHash(null);

    startTransition(async () => {
      try {
        if (!ready || !authenticated || !user?.id) {
          setError("Please log in before sending funds.");
          return;
        }

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
          const selectedBank = BANKS.find((b) => b.code === bankCode);
          await sendFiat(
            user.id,
            amt,
            selectedBank?.name ?? "Bank",
            accountNumber.trim(),
            bankCode,
            user?.email?.address ?? "SwiftFix User",
          );
          setSuccess("NGN transfer submitted successfully.");
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

          if (!embeddedWallet) {
            setError(
              "Embedded wallet not available. Please reconnect and try again.",
            );
            return;
          }

          await embeddedWallet.switchChain(POLYGON_CHAIN_ID);
          const provider = await embeddedWallet.getEthereumProvider();
          const walletClient = createWalletClient({
            chain: polygon,
            transport: custom(provider),
          });

          // STRICT DECIMAL HANDLING: Polygon USDT has 6 decimals.
          const amount = parseUnits(amt.toString(), POLYGON_USDT_DECIMALS);
          const data = encodeFunctionData({
            abi: MINIMAL_ERC20_ABI,
            functionName: "transfer",
            args: [walletAddress.trim() as `0x${string}`, amount],
          });

          try {
            const hash = await walletClient.sendTransaction({
              account: embeddedWallet.address as `0x${string}`,
              to: POLYGON_USDT_ADDRESS,
              data,
              value: BigInt(0),
            });
            setTxHash(hash);
            setIsConfirming(true);
            await polygonPublicClient.waitForTransactionReceipt({
              hash: hash as `0x${string}`,
              confirmations: 1,
            });
            setSuccess("USDT transfer submitted on-chain successfully.");
            setCryptoAmount("");
            setWalletAddress("");
          } catch (e) {
            const message =
              e instanceof Error
                ? e.message
                : "USDT transfer failed. Please try again.";
            const normalized = message.toLowerCase();
            if (
              normalized.includes("insufficient funds") ||
              normalized.includes("insufficient") ||
              normalized.includes("gas")
            ) {
              setError(
                "Insufficient Gas (MATIC). You need a small amount of MATIC on Polygon to pay the network fee.",
              );
            } else {
              setError(message);
            }
          } finally {
            setIsConfirming(false);
          }
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
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value as typeof bankCode)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
              >
                {BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
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
                onChange={() => undefined}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="Polygon">Polygon</option>
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

        {txHash ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
            <div className="font-semibold text-zinc-900">Transaction hash</div>
            <div className="mt-1 break-all font-mono text-[11px] text-zinc-600">
              {txHash}
            </div>
            {isConfirming ? (
              <div className="mt-2 text-xs text-zinc-600">
                Confirming on-chain…
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSend}
          disabled={isPending || isConfirming}
          className={[
            "mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-zinc-200",
            isPending || isConfirming
              ? "cursor-not-allowed bg-zinc-200 text-zinc-500"
              : "bg-zinc-900 text-white hover:bg-zinc-800",
          ].join(" ")}
        >
          <Send className="h-4 w-4" />
          {isConfirming
            ? "Confirming on-chain..."
            : isPending
              ? "Sending funds..."
              : "Send Funds"}
        </button>
      </div>
    </section>
  );
}

export default SendMoneyCard;

