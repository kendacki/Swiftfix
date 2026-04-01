"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

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

  const updatedWallet = await prisma.$transaction(
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
  );

  revalidatePath("/wallet");
  revalidatePath("/transactions");

  return updatedWallet;
}

