"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function sendFiat(
  privyId: string,
  amount: number,
  bankName: string,
  accountNumber: string
) {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  await prisma.$transaction(
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
      if (currentNgn < amount) {
        throw new Error("Insufficient NGN balance");
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          ngnBalance: {
            decrement: amount,
          },
        },
      });

      const descBankName = bankName || "Bank";
      const description = `Transfer to ${descBankName} - ${accountNumber}`;

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAWAL",
          amount,
          currency: "NGN",
          status: "COMPLETED",
          description,
        },
      });
    },
    {
      maxWait: 10000,
      timeout: 20000,
    }
  );

  revalidatePath("/wallet");
  revalidatePath("/transactions");
}

export async function sendCrypto(
  privyId: string,
  amount: number,
  walletAddress: string,
  network: string
) {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  await prisma.$transaction(
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
        throw new Error("Insufficient USDT balance");
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          usdtBalance: {
            decrement: amount,
          },
        },
      });

      const networkLabel = network || "Network";
      const description = `Sent to ${networkLabel} Address`;

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAWAL",
          amount,
          currency: "USDT",
          status: "COMPLETED",
          description,
        },
      });
    },
    {
      maxWait: 10000,
      timeout: 20000,
    }
  );

  revalidatePath("/wallet");
  revalidatePath("/transactions");
}

