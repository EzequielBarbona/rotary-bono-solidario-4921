import { config } from "dotenv";
config();
config({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/*
 * Siembra los numeros de la campaña del PolioPlus, que es la que trae esta
 * base desde el principio: del 1 al 1000.
 *
 * Los numeros de cualquier otra campaña se crean con
 * scripts/sembrar-numeros.mjs, que recibe el slug y el rango: cada
 * campaña numera a su manera (la camiseta va del 000 al 999) y no hay un
 * rango "por defecto" que valga para todas.
 */
const CAMPANIA = "polioplus";

async function main() {
  const totalTickets = Number(process.env.RAFFLE_TOTAL_TICKETS ?? 1000);
  const existing = await prisma.ticket.count({ where: { campania: CAMPANIA } });
  if (existing > 0) {
    console.log(
      `Ya hay ${existing} tickets de ${CAMPANIA} en la base, no se vuelve a sembrar.`
    );
    return;
  }

  const data = Array.from({ length: totalTickets }, (_, i) => ({
    campania: CAMPANIA,
    number: i + 1,
  }));
  await prisma.ticket.createMany({ data });
  console.log(`Se crearon ${totalTickets} tickets de ${CAMPANIA} (1 a ${totalTickets}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
