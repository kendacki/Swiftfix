"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { withDbRetry } from "@/lib/db-retry";

export async function ensureUserAndWallet(privyId: string, email?: string) {
  if (!privyId?.trim()) {
    throw new Error("Missing Privy ID.");
  }

  const user = await prisma.user.upsert({
    where: { privyId },
    create: {
      privyId,
      ...(email?.trim() ? { email: email.trim() } : {}),
    },
    update: {
      ...(email?.trim() ? { email: email.trim() } : {}),
    },
  });

  let wallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId: user.id,
      },
    });
  }

  return { user, wallet };
}

export async function getUserWallet(privyId: string, email?: string) {
  const { wallet } = await ensureUserAndWallet(privyId, email);
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
          const user = await tx.user.upsert({
            where: { privyId },
            create: { privyId },
            update: {},
          });

          const wallet =
            (await tx.wallet.findUnique({
              where: { userId: user.id },
            })) ??
            (await tx.wallet.create({
              data: { userId: user.id },
            }));

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

export async function handleTransactionConfirm(args: {
  privyId: string;
  transactionHash: string;
  amount: number;
  chainLabel?: string;
}) {
  const { privyId, transactionHash, amount, chainLabel } = args;

  if (!privyId?.trim()) {
    throw new Error("Missing Privy ID.");
  }
  if (!transactionHash?.trim() || !transactionHash.startsWith("0x")) {
    throw new Error("Invalid transaction hash.");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid amount.");
  }

  // Deduplicate on-chain confirmations by tx hash.
  const result = await withDbRetry(
    () =>
      prisma.$transaction(
        async (tx) => {
          const existing = await tx.transaction.findFirst({
            where: { reference: transactionHash },
            select: { id: true },
          });
          if (existing) {
            throw new Error("Duplicate transaction");
          }

          const user = await tx.user.upsert({
            where: { privyId },
            create: { privyId },
            update: {},
            select: { id: true },
          });

          const wallet =
            (await tx.wallet.findUnique({
              where: { userId: user.id },
            })) ??
            (await tx.wallet.create({
              data: { userId: user.id },
            }));

          const updatedWallet = await tx.wallet.update({
            where: { id: wallet.id },
            data: {
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
              currency: "USDT",
              status: "COMPLETED",
              reference: transactionHash,
              description: `USDT deposit confirmed on-chain${chainLabel ? ` (${chainLabel})` : ""}`,
            },
          });

          return updatedWallet;
        },
        {
          maxWait: 10000,
          timeout: 20000,
        },
      ),
  );

  revalidatePath("/wallet");
  revalidatePath("/transactions");

  return result;
}

