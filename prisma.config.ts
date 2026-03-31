import { defineConfig } from '@prisma/config';
import 'dotenv/config'; // This ensures Prisma can read your .env file!

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});