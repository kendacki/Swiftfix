import { PrismaClient } from '@prisma/client';

// Keep our bulletproof Vercel URL resolver
const getDbUrl = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
  
  if (!url || url === "undefined" || url === "null" || url.trim() === "") {
    console.error("🚨 FATAL: Database URL is evaluating to:", url);
    throw new Error("Cannot connect to Database: Invalid URL string.");
  }
  return url;
};

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Instantiate the standard, native client
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDbUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
