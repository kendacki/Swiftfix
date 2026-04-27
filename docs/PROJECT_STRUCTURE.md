# Project Structure

This document maps the repository so new contributors can quickly locate logic, understand boundaries, and make changes safely.

## Top-Level Layout

- `app/`: Next.js App Router routes, layouts, and API route handlers
- `actions/`: Server actions for domain operations (auth, wallets, swaps, requests, transfers)
- `components/`: Reusable UI modules and route-level building blocks
- `hooks/`: Client-side hooks for balances, KYC state, and user display data
- `lib/`: Shared infrastructure (Prisma client, API clients, utility helpers, constants)
- `prisma/`: Schema, migrations, and seed script
- `public/`: Static assets (logos, images)
- `scripts/`: Maintenance scripts used by hooks and local workflows
- `types/`: Shared TypeScript types

## Route Layer (`app/`)

- `app/page.tsx`: Public landing page
- `app/(dashboard)/layout.tsx`: Protected dashboard shell layout
- `app/(dashboard)/dashboard/page.tsx`: Main user dashboard
- `app/(dashboard)/wallet/page.tsx`: Wallet and balance view
- `app/(dashboard)/transactions/page.tsx`: Transaction history
- `app/(dashboard)/request/page.tsx`: Service request flow
- `app/(dashboard)/kyc/page.tsx`: Verification flow
- `app/(dashboard)/profile/page.tsx`: User profile
- `app/(dashboard)/settings/page.tsx`: App and security settings
- `app/api/webhooks/kyc/route.ts`: KYC webhook endpoint

## Domain Actions (`actions/`)

Use this folder for server-side business logic. Keep actions cohesive by domain.

- `authActions.ts`: Authentication-related actions
- `walletActions.ts`: Wallet reads/writes and balance workflows
- `swapActions.ts`: Swap execution and exchange workflows
- `transferActions.ts`: Transfer and settlement workflows
- `requestActions.ts`: Service request operations
- `paymentActions.ts`: Payment initiation and bookkeeping
- `transactionActions.ts`: Transaction logging/query actions
- `avatarActions.ts`: Profile avatar uploads/updates
- `aiActions.ts`: AI extraction and prompt-driven workflows
- `tinyfishActions.ts`: TinyFish data/source integration

## Shared Infrastructure (`lib/`)

- `prisma.ts`: Prisma singleton client
- `privy-server.ts`: Server-side auth client setup
- `groq.ts`: Groq API setup
- `db-retry.ts`: Retry wrapper for database operations
- `urgency.ts`: Urgency normalization and scoring utilities
- `constants/`: Chain, token, and ABI constants
- `viem/polygonClient.ts`: Polygon chain client setup

## Contributor Rules of Thumb

- Keep UI in `components/` and business logic in `actions/`.
- Keep route files thin by delegating logic to actions or hooks.
- Put cross-domain helper code in `lib/`, not inside route files.
- Add migrations for schema changes and avoid relying only on `db push` in shared environments.
