"use server";

import prisma from "@/lib/prisma";

export async function syncUser(privyId: string, email?: string) {
  if (!privyId) {
    throw new Error("Missing Privy ID for syncUser.");
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { privyId },
      include: {
        wallet: true,
      },
    });

    if (existing) {
      return existing;
    }

    const created = await prisma.$transaction(
      async (tx) => {
      const user = await tx.user.create({
        data: {
          privyId,
          email: email ?? undefined,
          wallet: {
            create: {},
          },
        },
        include: {
          wallet: true,
        },
      });

      return user;
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );

    return created;
  } catch (error) {
    console.error("syncUser error:", error);
    return null;
  }
}

