# Recreate SwiftFix From Scratch

This guide helps any engineer recreate a working local environment quickly and consistently.

## 1. Prerequisites

- Node.js 18+
- pnpm 10+
- PostgreSQL connection (Neon or equivalent)
- Privy credentials
- Groq API key
- TinyFish API key
- Paystack keys

## 2. Clone and Install

```bash
git clone https://github.com/kendacki/Swiftfix.git
cd Swiftfix
pnpm install
```

## 3. Environment Setup

Create `.env` from `.env.example` and fill all values:

```bash
cp .env.example .env
```

Required keys:

- `NEXT_PUBLIC_PRIVY_APP_ID`
- `PRIVY_APP_SECRET`
- `DATABASE_URL`
- `DIRECT_URL`
- `GROQ_API_KEY`
- `TINYFISH_API_KEY`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`

## 4. Database Setup

Generate client and push schema:

```bash
pnpm db:push
```

Optional seed:

```bash
pnpm db:seed
```

## 5. Run App

```bash
pnpm dev
```

Visit `http://localhost:3000`.

## 6. Validate Before Push

Run the same checks enforced by git hooks:

```bash
pnpm predeploy
```

## 7. Deployment Notes

- Production target: Vercel
- Build command in repo: `pnpm build`
- If using migrations in production, run `pnpm db:deploy`

## Troubleshooting

- Prisma client mismatch:
  - Run `pnpm build` or `npx prisma generate`
- Hook failures on commit/push:
  - Run `pnpm predeploy` locally to get full logs
- Lockfile drift:
  - Run `pnpm install` after switching branches (post-checkout hook also handles this)
