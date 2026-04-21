"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

type PaystackVerifyResponse = {
  status?: boolean;
  message?: string;
  data?: {
    status?: string;
    amount?: number; // kobo
    reference?: string;
    currency?: string;
  };
};

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
    },
    {
      maxWait: 10000,
      timeout: 20000,
    }
  );

  revalidatePath("/transactions");
  revalidatePath("/wallet");
}

export async function verifyPaystackDeposit(reference: string, privyId: string) {
  if (!reference?.trim()) {
    throw new Error("Missing Paystack reference.");
  }
  if (!privyId?.trim()) {
    throw new Error("Missing Privy ID.");
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("Paystack is not configured (PAYSTACK_SECRET_KEY).");
  }

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Paystack verification failed (${res.status}). ${body || res.statusText}`,
    );
  }

  const payload = (await res.json()) as PaystackVerifyResponse;
  const status = payload?.data?.status;
  if (status !== "success") {
    throw new Error(`Paystack status is not success (${status ?? "unknown"}).`);
  }

  const amountKobo = payload?.data?.amount;
  if (typeof amountKobo !== "number" || !Number.isFinite(amountKobo) || amountKobo <= 0) {
    throw new Error("Invalid amount returned from Paystack.");
  }

  const amountNgn = amountKobo / 100;

  // CRITICAL SECURITY: Prisma update must be atomic and deduped by reference.
  await prisma.$transaction(
    async (tx) => {
      const existing = await tx.transaction.findFirst({
        where: { reference },
        select: { id: true },
      });
      if (existing) {
        throw new Error("Duplicate transaction");
      }

      const user = await tx.user.findUnique({
        where: { privyId },
        select: { id: true },
      });

      if (!user) {
        throw new Error("User not found for provided Privy ID.");
      }

      let wallet = await tx.wallet.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId: user.id },
          select: { id: true },
        });
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          ngnBalance: {
            increment: amountNgn,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "DEPOSIT",
          amount: amountNgn,
          currency: "NGN",
          status: "COMPLETED",
          reference,
          description: `Paystack deposit (${reference})`,
        },
      });
    },
    {
      maxWait: 10000,
      timeout: 20000,
    },
  );

  revalidatePath("/wallet");
  revalidatePath("/transactions");
}

