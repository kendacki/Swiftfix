"use server";

import type { Transaction } from "@prisma/client";
import prisma from "@/lib/prisma";
import { withDbRetry } from "@/lib/db-retry";

export async function getUserTransactions(privyId: string): Promise<Transaction[]> {
  try {
    const user = await withDbRetry(() =>
      prisma.user.findUnique({
        where: { privyId },
      })
    );

    if (!user) return [];

    return await withDbRetry(() =>
      prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      })
    );
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

