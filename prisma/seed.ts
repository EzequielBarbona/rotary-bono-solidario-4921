import { config } from "dotenv";
config();
config({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const totalTickets = Number(process.env.RAFFLE_TOTAL_TICKETS ?? 1000);
  const existing = await prisma.ticket.count();
  if (existing > 0) {
    console.log(`Ya hay ${existing} tickets en la base, no se vuelve a sembrar.`);
    return;
  }

  const data = Array.from({ length: totalTickets }, (_, i) => ({ number: i + 1 }));
  await prisma.ticket.createMany({ data });
  console.log(`Se crearon ${totalTickets} tickets (1 a ${totalTickets}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
