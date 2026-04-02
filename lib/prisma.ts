import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// 1. Dynamic Getter: Bypasses static bundler replacement and checks all Vercel naming conventions
const getDbUrl = () => {
  // Check standard name, Vercel Postgres names, and bracket notation to avoid Webpack stripping
  const url = process.env['DATABASE_URL'] || process.env['POSTGRES_PRISMA_URL'] || process.env['POSTGRES_URL'] || process.env.DATABASE_URL;
  
  if (!url) {
    // If it still fails, log exactly what Vercel DID inject so we can see the real name
    const keys = Object.keys(process.env).filter(k => !k.startsWith('npm_'));
    console.error("🚨 FATAL: Database URL is entirely missing. Available Vercel Variables:", keys.join(', '));
    throw new Error("Cannot connect to Database: Environment Variable missing in Vercel Runtime.");
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