"use server";

import type { Transaction } from "@prisma/client";
import prisma from "@/lib/prisma";

export async function getUserTransactions(privyId: string): Promise<Transaction[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { privyId },
      include: {
        transactions: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) return [];
    return user.transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

