import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Tell Neon to use the standard Node.js WebSocket
neonConfig.webSocketConstructor = ws;

const prismaClientSingleton = () => {
  // We use the same pooled DATABASE_URL from Vercel
  const connectionString = process.env.DATABASE_URL;

  // Failsafe: Loudly warn if the variable is missing from Vercel
  if (!connectionString) {
    throw new Error(
      "🚨 CRITICAL ERROR: DATABASE_URL environment variable is missing or undefined!",
    );
  }

  // Initialize the Neon Pool
  const pool = new Pool({ connectionString });

  // Pass the pool to the Prisma Adapter
  // @ts-expect-error - Known type mismatch between Neon serverless and Prisma adapter definitions
  const adapter = new PrismaNeon(pool);

  // Initialize Prisma with the custom adapter
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;