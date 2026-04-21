"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { withDbRetry } from "@/lib/db-retry";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=ngn";

type SwapRatePayload = {
  rate: number;
  quoteId: string;
  expiresAt: number;
};

export async function getLiveSwapRate(): Promise<SwapRatePayload> {
  const fallbackRate = 1500; // realistic USDT->NGN MVP rate

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(COINGECKO_URL, {
      method: "GET",
      signal: controller.signal,
      // CoinGecko is public, no auth header required
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error("CoinGecko error:", res.status, res.statusText);
      return {
        rate: fallbackRate,
        quoteId: `cg-fallback-${Date.now()}`,
        expiresAt: Date.now() + 60_000,
      };
    }

    const data = (await res.json()) as {
      tether?: { ngn?: number };
    };

    const fetchedRate = data?.tether?.ngn;
    const rate =
      typeof fetchedRate === "number" && fetchedRate > 0
        ? fetchedRate
        : fallbackRate;

    return {
      rate,
      quoteId: `cg-quote-${Date.now()}`,
      expiresAt: Date.now() + 60_000,
    };
  } catch (error) {
    clearTimeout(timeout);
    console.error("CoinGecko fetch error:", error);
    return {
      rate: fallbackRate,
      quoteId: `cg-fallback-${Date.now()}`,
      expiresAt: Date.now() + 60_000,
    };
  }
}

export async function executeSwap(
  privyId: string,
  fromCurrency: "USDT",
  toCurrency: "NGN",
  amount: number,
  quotedRate: number
) {
  if (amount <= 0 || quotedRate <= 0) {
    throw new Error("Invalid swap parameters.");
  }

  const updatedWallet = await withDbRetry(
    () =>
      prisma.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { privyId },
          });

          if (!user) {
            throw new Error("User not found for provided Privy ID.");
          }

          const wallet = await tx.wallet.findUnique({
            where: { userId: user.id },
          });

          if (!wallet) {
            throw new Error("Wallet not found for user.");
          }

          const currentUsdt = Number(wallet.usdtBalance);
          if (currentUsdt < amount) {
            throw new Error("Insufficient balance");
          }

          const ngnDelta = amount * quotedRate;

          const newWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              usdtBalance: {
                decrement: amount,
              },
              ngnBalance: {
                increment: ngnDelta,
              },
            },
          });

          await tx.transaction.create({
            data: {
              userId: user.id,
              type: "SWAP",
              amount,
              currency: fromCurrency,
              status: "COMPLETED",
              description: `Swap ${amount} ${fromCurrency} to NGN at rate ${quotedRate}`,
            },
          });

          return newWallet;
        },
        {
          maxWait: 10000,
          timeout: 20000,
        }
      )
  );

  revalidatePath("/wallet");
  revalidatePath("/transactions");

  return updatedWallet;
}

export async function verifyAndCreditNgnSwap(
  transactionHash: string,
  privyId: string,
  amount: number
) {
  if (!transactionHash || !transactionHash.startsWith("0x")) {
    throw new Error("Invalid transaction hash.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid swap amount.");
  }

  const quote = await getLiveSwapRate();
  const ngnDelta = amount * quote.rate;

  // TODO: CRITICAL SECURITY
  // Relying strictly on a client-provided transaction hash is unsafe for production. Implement a backend listener (e.g., Alchemy Webhooks or a cron-job reading RPC blocks) to independently verify the transfer to the Treasury Wallet before finalizing the NGN credit.
  const updatedWallet = await withDbRetry(
    () =>
      prisma.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { privyId },
          });

          if (!user) {
            throw new Error("User not found for provided Privy ID.");
          }

          let wallet = await tx.wallet.findUnique({
            where: { userId: user.id },
          });

          if (!wallet) {
            wallet = await tx.wallet.create({
              data: {
                userId: user.id,
              },
            });
          }

          const newWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              ngnBalance: {
                increment: ngnDelta,
              },
            },
          });

          await tx.transaction.create({
            data: {
              userId: user.id,
              type: "SWAP",
              amount,
              currency: "USDT",
              status: "COMPLETED",
              reference: transactionHash,
              description: `On-chain USDT->NGN swap credit for ${amount} USDT (hash ${transactionHash})`,
            },
          });

          return newWallet;
        },
        {
          maxWait: 10000,
          timeout: 20000,
        }
      )
  );

  revalidatePath("/wallet");
  revalidatePath("/transactions");

  return updatedWallet;
}

export async function debitNgnForUsdtSwapMock(
  privyId: string,
  amountNgn: number,
  quotedRate: number
) {
  if (!Number.isFinite(amountNgn) || amountNgn <= 0 || quotedRate <= 0) {
    throw new Error("Invalid swap parameters.");
  }

  const expectedUsdt = amountNgn / quotedRate;

  const updatedWallet = await withDbRetry(
    () =>
      prisma.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { privyId },
          });

          if (!user) {
            throw new Error("User not found for provided Privy ID.");
          }

          const wallet = await tx.wallet.findUnique({
            where: { userId: user.id },
          });

          if (!wallet) {
            throw new Error("Wallet not found for user.");
          }

          const currentNgn = Number(wallet.ngnBalance);
          if (currentNgn < amountNgn) {
            throw new Error("Insufficient NGN balance");
          }

          const newWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              ngnBalance: {
                decrement: amountNgn,
              },
            },
          });

          await tx.transaction.create({
            data: {
              userId: user.id,
              type: "SWAP",
              amount: amountNgn,
              currency: "NGN",
              status: "PENDING",
              description: `NGN->USDT swap requested (mock). Expect ~${expectedUsdt.toFixed(
                2
              )} USDT. Backend will later send USDT on-chain.`,
            },
          });

          return newWallet;
        },
        {
          maxWait: 10000,
          timeout: 20000,
        }
      )
  );

  // NOTE: Backend will need a private key/server wallet integration to push USDT on-chain to the user.
  revalidatePath("/wallet");
  revalidatePath("/transactions");

  return updatedWallet;
}

