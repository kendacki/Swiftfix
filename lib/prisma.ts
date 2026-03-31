import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import WebSocket from "ws";

neonConfig.webSocketConstructor = WebSocket;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing DATABASE_URL in environment variables");
}

const adapter = new PrismaNeon({ connectionString });

const createPrismaClient = () => new PrismaClient({ adapter });

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;