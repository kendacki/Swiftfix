"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function payArtisan(
  privyId: string,
  artisanName: string,
  amount: number
) {
  if (!privyId) {
    throw new Error("Missing Privy ID for payment.");
  }

  if (amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  await prisma.$transaction(async (tx) => {
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
      throw new Error("Insufficient funds. Please fund your wallet.");
    }

    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        ngnBalance: {
          decrement: amount,
        },
      },
    });

    const description = `Payment to artisan: ${artisanName}`;

    await tx.transaction.create({
      data: {
        userId: user.id,
        type: "PAYMENT",
        amount,
        currency: "NGN",
        status: "COMPLETED",
        description,
      },
    });
  });

  revalidatePath("/transactions");
  revalidatePath("/wallet");
}

