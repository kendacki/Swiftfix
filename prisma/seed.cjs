/**
 * Seed vetted artisans for trade + location search (extractRequestDetails Step 6).
 * Run after migrations: `npx prisma db seed`
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/** Fixed IDs so re-running the seed updates the same rows (idempotent). */
const SEED_ARTISANS = [
  {
    id: "a0000000-0000-4000-8000-000000000001",
    trade: "Plumber",
    location: "Yaba, Lagos",
    name: "Ade & Sons Plumbing",
    phoneNumber: "08012345678",
    email: "contact@adesons.example",
    address: "Herbert Macaulay Way, Yaba",
    rating: 4.8,
    snippet: "Emergency leaks, pipe fitting, bathroom installs.",
  },
  {
    id: "a0000000-0000-4000-8000-000000000002",
    trade: "Electrician",
    location: "Surulere, Lagos",
    name: "BrightWire Electricals",
    phoneNumber: "08098765432",
    email: "hello@brightwire.example",
    address: "Bode Thomas Street, Surulere",
    rating: 4.6,
    snippet: "Wiring, breaker panels, generator hookups.",
  },
  {
    id: "a0000000-0000-4000-8000-000000000003",
    trade: "Generator Mechanic",
    location: "Ikeja, Lagos",
    name: "PowerFix Generator Services",
    phoneNumber: "08055501234",
    email: null,
    address: "Computer Village area, Ikeja",
    rating: 4.7,
    snippet: "Servicing, carburetor tune-ups, AVR replacement.",
  },
];

async function main() {
  for (const row of SEED_ARTISANS) {
    await prisma.artisan.upsert({
      where: { id: row.id },
      create: row,
      update: {
        trade: row.trade,
        location: row.location,
        name: row.name,
        phoneNumber: row.phoneNumber,
        email: row.email,
        address: row.address,
        rating: row.rating,
        snippet: row.snippet,
      },
    });
  }
  console.log(`Seeded ${SEED_ARTISANS.length} artisans (upsert).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
