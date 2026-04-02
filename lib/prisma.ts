import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Tell Neon to use the standard Node.js WebSocket
neonConfig.webSocketConstructor = ws;

const prismaClientSingleton = () => {
  // 1. Force Next.js to read the variable explicitly
  const connectionString = `${process.env.DATABASE_URL}`;

  // 2. Secondary Failsafe check (just in case the string equals "undefined")
  if (!connectionString || connectionString === "undefined") {
    throw new Error(
      "🚨 CRITICAL ERROR: Vercel failed to inject DATABASE_URL into the runtime environment.",
    );
  }

  // 3. Initialize the Neon Pool explicitly passing the string
  const pool = new Pool({ connectionString: connectionString });

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