import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const deleted = await prisma.transaction.deleteMany({});
    const updatedWallets = await prisma.wallet.updateMany({
      data: {
        ngnBalance: 0,
        usdtBalance: 0,
      },
    });

    console.log(
      `Purge complete. Deleted ${deleted.count} transactions. Zeroed balances for ${updatedWallets.count} wallets.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();

