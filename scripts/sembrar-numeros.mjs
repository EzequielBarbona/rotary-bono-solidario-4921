// Crea los numeros de una campaña en la base.
//
// Los numeros de una campaña existen como filas en Ticket: la grilla de la
// pantalla de compra sale de ahi, y la reserva es un UPDATE sobre esas
// filas. Una campaña sin sembrar muestra la grilla vacia y no vende nada.
//
//   node ./scripts/sembrar-numeros.mjs <slug> <primer numero> <cantidad>
//
// Por ejemplo, los 1.000 numeros del 000 al 999 de la camiseta:
//
//   node ./scripts/sembrar-numeros.mjs camiseta-solidaria 0 1000
//
// Los tres datos van a mano, y no leidos de src/lib/campanias.ts, porque
// esto se corre una vez por campaña contra la base de produccion: es mejor
// escribir el rango y que el script lo confirme antes de insertar, que
// que lo adivine solo.
//
// Es idempotente: si la campaña ya tiene numeros, no toca nada.
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

for (const linea of readFileSync("./.env.local", "utf8").split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(linea.trim());
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const [slug, desdeTexto, cantidadTexto] = process.argv.slice(2);
const desde = Number(desdeTexto);
const cantidad = Number(cantidadTexto);

if (!slug || !Number.isInteger(desde) || !Number.isInteger(cantidad) || cantidad <= 0) {
  console.error(
    "Uso: node ./scripts/sembrar-numeros.mjs <slug> <primer numero> <cantidad>"
  );
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const hasta = desde + cantidad - 1;
const existentes = await prisma.ticket.count({ where: { campania: slug } });

if (existentes > 0) {
  console.log(
    `La campaña "${slug}" ya tiene ${existentes} numeros en la base. No se toca nada.`
  );
} else {
  const data = Array.from({ length: cantidad }, (_, i) => ({
    campania: slug,
    number: desde + i,
  }));
  const { count } = await prisma.ticket.createMany({ data });
  console.log(`Se crearon ${count} numeros de "${slug}" (del ${desde} al ${hasta}).`);
}

// Al final, el estado de todas las campañas: es la forma mas rapida de ver
// que no se duplico ni se piso nada.
const porCampania = await prisma.ticket.groupBy({
  by: ["campania", "status"],
  _count: true,
});
for (const fila of porCampania.sort((a, b) => a.campania.localeCompare(b.campania))) {
  console.log(`  ${fila.campania} · ${fila.status}: ${fila._count}`);
}

await prisma.$disconnect();
