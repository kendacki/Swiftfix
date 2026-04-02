import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Do not initialize the pool here!
let prismaInstance: PrismaClient | undefined;

const getPrisma = () => {
  if (prismaInstance) return prismaInstance;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("🚨 CRITICAL ERROR: DATABASE_URL is missing at runtime.");
  }

  const pool = new Pool({ connectionString });
  // @ts-expect-error - Known type mismatch
  const adapter = new PrismaNeon(pool);
  
  prismaInstance = new PrismaClient({ adapter });
  return prismaInstance;
};

declare global {
  var prismaGlobal: undefined | PrismaClient;
}

// Export a Proxy so the rest of the app doesn't need to change imports
const prisma = globalThis.prismaGlobal ?? new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    const client = getPrisma();
    return Reflect.get(client, prop);
  }
});

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;