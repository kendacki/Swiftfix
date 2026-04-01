import { defineConfig } from "@prisma/config";

/**
 * `prisma generate` does not open a DB connection, but Prisma 7 still needs a
 * syntactically valid URL. Vercel may run `postinstall` / install before env is
 * applied, so fall back to a placeholder when DATABASE_URL is missing.
 */
const datasourceUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public";

export default defineConfig({
  datasource: {
    url: datasourceUrl,
  },
});