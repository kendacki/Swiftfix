"use server";

import type { Transaction } from "@prisma/client";
import prisma from "@/lib/prisma";
import { withDbRetry } from "@/lib/db-retry";

export async function getUserTransactions(privyId: string): Promise<Transaction[]> {
  try {
    const user = await withDbRetry(() =>
      prisma.user.findUnique({
        where: { privyId },
        include: {
          transactions: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      })
    );

    if (!user) return [];
    return user.transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

