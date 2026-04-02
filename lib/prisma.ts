import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const getDbUrl = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
  
  // Block both missing variables AND Webpack's string-literal bugs
  if (!url || url === "undefined" || url === "null" || url.trim() === "") {
    console.error("🚨 FATAL: Database URL is literally evaluating to:", url);
    throw new Error("Cannot connect to Database: Vercel injected an invalid string.");
  }
  return url;
};

// 2. Global instance to prevent hot-reload exhaustion in dev
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// 3. Instantiate the client safely
const pool = new Pool({ connectionString: getDbUrl() });

// @ts-expect-error - Known type mismatch between Neon serverless and Prisma adapter definitions
const adapter = new PrismaNeon(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;