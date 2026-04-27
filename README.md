# SwiftFix

SwiftFix is a fintech + AI platform that combines:

- Dual-balance wallet flows (USDT and NGN)
- Real-time swap and transfer actions
- AI-assisted artisan discovery and request flows
- Secure user authentication and KYC gating

This repository uses Next.js App Router with server actions, Prisma, and Tailwind.

## Quick Start

1. Clone and install dependencies.

```bash
git clone https://github.com/kendacki/Swiftfix.git
cd Swiftfix
pnpm install
```

2. Copy environment values.

```bash
cp .env.example .env
```

3. Set required variables in `.env`.

- `NEXT_PUBLIC_PRIVY_APP_ID`
- `PRIVY_APP_SECRET`
- `DATABASE_URL`
- `DIRECT_URL`
- `GROQ_API_KEY`
- `TINYFISH_API_KEY`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`

4. Initialize Prisma and run locally.

```bash
pnpm db:push
pnpm dev
```

## Common Commands

- `pnpm dev`: Start local development server
- `pnpm lint`: Run ESLint
- `pnpm build`: Generate Prisma client and build Next.js
- `pnpm predeploy`: Run lint + build (same checks as git hooks)
- `pnpm db:push`: Push schema changes to database
- `pnpm db:deploy`: Apply migrations in deployment environments
- `pnpm db:seed`: Seed database

## Documentation Map

- `docs/PROJECT_STRUCTURE.md`: Folder-by-folder codebase map and ownership boundaries
- `docs/RECREATE.md`: Step-by-step recreation guide for a fresh environment
- `CONTRIBUTING.md`: Workflow, commit message guidance, and PR checklist

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Privy auth
- Groq SDK

## Notes

- Git hooks run `pnpm predeploy` on commit and push.
- `pnpm-lock.yaml` is the canonical lockfile.
- Deployment target is Vercel.
