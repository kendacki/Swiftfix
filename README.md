# SwiftFix

## Overview

SwiftFix is a next-generation fintech and AI-powered service platform. It bridges the gap between decentralized finance and local commerce by providing users with a secure dual-currency wallet (NGN and USDT) and an intelligent search engine to find, book, and pay local professionals.

The core mission of SwiftFix is to eliminate the friction of liquidity and discovery. Users can hold crypto, swap to fiat in real-time using live market data, and immediately spend those funds to hire verified local artisans—all within a single, seamless application.

## Core Features

* **Dual-Currency Wallet System**: Users have dedicated NGN (Fiat) and USDT (Crypto) balances, strictly managed and securely synced to a PostgreSQL database.
* **Real-Time Swap Engine**: Integration with open market APIs to fetch live exchange rates, allowing users to instantly calculate and execute USDT to NGN swaps.
* **AI Artisan Search**: Powered by Groq and Llama 3 models, users can type natural language requests (e.g., "I need a plumber in Lekki"). The AI extracts the required trade, location, and urgency parameters.
* **Dynamic Professional Sourcing**: Integration with the TinyFish API dynamically fetches real, local professionals based on the AI's extracted parameters.
* **Integrated Payment Gateway**: Users can instantly book and pay professionals directly from their SwifFund fiat wallet, automatically generating verifiable transaction receipts.
* **Secure Authentication**: Powered by Privy, ensuring robust user identity verification and seamless onboarding.

## Technology Stack

* **Framework**: Next.js (App Router, Server Actions)
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **Database**: PostgreSQL (hosted on Neon)
* **ORM**: Prisma
* **Authentication**: Privy
* **AI Infrastructure**: Groq SDK (LLM processing)
* **External APIs**: TinyFish (data scraping), CoinGecko (market rates)

## Project Structure

* `/app`: Contains all Next.js App Router pages.
  * `/(dashboard)`: Protected route group containing the core application views (Wallet, Transactions, Request, Dashboard).
* `/actions`: Server Actions handling secure backend logic, database transactions, and third-party API communication.
* `/components`: Reusable UI components including the `AuthGuard`, `SwapCard`, `SendMoneyCard`, and layout navigation.
* `/lib`: Core configuration files, including the Prisma database singleton.
* `/prisma`: Database schema definitions and migration configurations.

## Prerequisites

To run this project locally, ensure you have the following installed:

* Node.js (v18.x or higher)
* npm (v10.x or higher)
* A free account on Neon (database), Privy (auth), and Groq (AI)

## Environment Variables

Create a `.env` file in the root directory and configure the following required variables:

```env
# Database Configuration (Neon Serverless Postgres)
DATABASE_URL="postgresql://user:password@host/database"

# Authentication (Privy)
NEXT_PUBLIC_PRIVY_APP_ID="your_privy_app_id"
PRIVY_APP_SECRET="your_privy_app_secret"

# AI Configuration (Groq)
GROQ_API_KEY="your_groq_api_key"

# Artisan Search Data (TinyFish)
TINYFISH_API_KEY="your_tinyfish_api_key"
```

## Installation & Setup

Clone the repository:

```bash
git clone https://github.com/kendacki/Swiftfix.git
cd Swiftfix
```

Install dependencies:

```bash
npm install
```

Generate the Prisma Client:

```bash
npx prisma generate
```

Sync the database schema:

```bash
npx prisma db push
```

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Deployment

This application is optimized for deployment on Vercel.

Before deploying, ensure that your `package.json` includes a `postinstall` script to generate the Prisma client during the build process:

```json
"scripts": {
  "postinstall": "prisma generate"
}
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
