import { cp, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const src = path.join(root, "node_modules", ".prisma", "client");
const dest = path.join(root, "node_modules", "@prisma", "client", ".prisma", "client");

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(src))) {
  console.warn(`[sync-prisma-client] Source not found: ${src}`);
  process.exit(0);
}

await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true, force: true });

console.log(`[sync-prisma-client] Synced Prisma client to: ${dest}`);

