"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { withDbRetry } from "@/lib/db-retry";

export async function getUserWallet(privyId: string) {
  const user = await prisma.user.findUnique({
    where: { privyId },
  });

  if (!user) {
    throw new Error("User not found for provided Privy ID.");
  }

  const existingWallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
  });

  if (existingWallet) {
    return existingWallet;
  }

  const wallet = await prisma.wallet.create({
    data: {
      userId: user.id,
      // balances default to 0.00 via schema defaults
    },
  });

  return wallet;
}

function generateReference(prefix: string = "FW"): string {
  const nonce = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}-${Date.now()}-${nonce}`;
}

export async function fundWallet(
  privyId: string,
  amount: number,
  currency: "NGN" | "USDT"
) {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const result = await withDbRetry(
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

          const updatedWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data:
              currency === "NGN"
                ? {
                    ngnBalance: {
                      increment: amount,
                    },
                  }
                : {
                    usdtBalance: {
                      increment: amount,
                    },
                  },
          });

          await tx.transaction.create({
            data: {
              userId: user.id,
              type: "DEPOSIT",
              amount,
              currency,
              status: "COMPLETED",
              reference: generateReference(),
              description: `Wallet funding of ${amount} ${currency}`,
            },
          });

          return updatedWallet;
        },
        {
          maxWait: 10000,
          timeout: 20000,
        }
      )
  );

  revalidatePath("/wallet");
  revalidatePath("/transactions");

  return result;
}

