"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ensureUserAndWallet } from "@/actions/walletActions";

export async function sendFiat(
  privyId: string,
  amount: number,
  bankName: string,
  accountNumber: string,
  bankCode?: string,
  recipientName?: string
) {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("Paystack is not configured (PAYSTACK_SECRET_KEY).");
  }

  const { user } = await ensureUserAndWallet(privyId);

  const wallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
  });

  if (!wallet) {
    throw new Error("Wallet not found for user.");
  }

  const currentNgn = Number(wallet.ngnBalance);
  if (currentNgn < amount) {
    throw new Error("Insufficient NGN balance");
  }

  const effectiveBankName = bankName || "Bank";
  const effectiveBankCode = bankCode?.trim();
  if (!effectiveBankCode) {
    throw new Error("Missing bank code.");
  }

  const name = (recipientName || "SwiftFix User").trim() || "SwiftFix User";
  const transferAmountKobo = Math.round(amount * 100);
  if (!Number.isFinite(transferAmountKobo) || transferAmountKobo <= 0) {
    throw new Error("Invalid transfer amount.");
  }

  // a) Create transfer recipient
  const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "nuban",
      name,
      account_number: accountNumber,
      bank_code: effectiveBankCode,
      currency: "NGN",
    }),
  });

  const recipientPayload = (await recipientRes.json().catch(() => null)) as
    | {
        status?: boolean;
        message?: string;
        data?: { recipient_code?: string };
      }
    | null;

  if (!recipientRes.ok || !recipientPayload?.status) {
    throw new Error(
      `Paystack recipient creation failed. ${recipientPayload?.message || ""}`.trim(),
    );
  }

  const recipientCode = recipientPayload.data?.recipient_code;
  if (!recipientCode) {
    throw new Error("Paystack recipient_code missing.");
  }

  // b) Initiate transfer
  const transferRes = await fetch("https://api.paystack.co/transfer", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: transferAmountKobo,
      recipient: recipientCode,
      reason: `SwiftFix NGN withdrawal to ${effectiveBankName}`,
    }),
  });

  const transferPayload = (await transferRes.json().catch(() => null)) as
    | {
        status?: boolean;
        message?: string;
        data?: { reference?: string };
      }
    | null;

  if (!transferRes.ok || !transferPayload?.status) {
    throw new Error(
      `Paystack transfer failed. ${transferPayload?.message || ""}`.trim(),
    );
  }

  const transferReference = transferPayload.data?.reference;
  if (!transferReference) {
    throw new Error("Paystack transfer reference missing.");
  }

  // Only now: deduct NGN + persist Transaction.
  await prisma.$transaction(
    async (tx) => {
      const freshWallet = await tx.wallet.findUnique({
        where: { userId: user.id },
      });

      if (!freshWallet) {
        throw new Error("Wallet not found for user.");
      }

      const latestNgn = Number(freshWallet.ngnBalance);
      if (latestNgn < amount) {
        throw new Error("Insufficient NGN balance");
      }

      await tx.wallet.update({
        where: { id: freshWallet.id },
        data: {
          ngnBalance: {
            decrement: amount,
          },
        },
      });

      const description = `Transfer to ${effectiveBankName} - ${accountNumber}`;

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAWAL",
          amount,
          currency: "NGN",
          status: "COMPLETED",
          reference: transferReference,
          description,
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

export async function sendCrypto(
  privyId: string,
  amount: number,
  walletAddress: string,
  network: string
) {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const ensured = await ensureUserAndWallet(privyId);

  await prisma.$transaction(
    async (tx) => {
      const user = ensured.user;
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

