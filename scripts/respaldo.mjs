// Respaldo de la base a archivos JSON, antes de un cambio de esquema.
//
// Neon tiene su propio respaldo por ramas, pero esta maquina no tiene
// pg_dump instalado y el cambio de esquema se hace desde aca: este script
// es la copia que se puede revisar y, si hace falta, volver a cargar.
//
// Las fotos de los comprobantes no van: son 109 MB y ya estan en disco,
// una por archivo, en informes/comprobantes/ (ver bajar-comprobantes.mts).
// Lo que se guarda aca es todo lo demas, que es lo que no se puede
// reconstruir de ningun otro lado.
//
//   node ./scripts/respaldo.mjs
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

for (const linea of readFileSync("./.env.local", "utf8").split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(linea.trim());
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const sello = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const destino = `./informes/respaldo-${sello}`;
mkdirSync(destino, { recursive: true });

// Todo menos receiptImage: la foto pesa y ya esta exportada aparte.
const columnasDeOrden = {
  id: true, buyerName: true, buyerEmail: true, buyerPhone: true,
  buyerCuit: true, buyerClub: true, ticketCount: true, totalAmount: true,
  status: true, paymentRef: true, receiptMimeType: true, receiptHash: true,
  createdAt: true, expiresAt: true, confirmationSentAt: true,
};

const tablas = {
  tickets: () => prisma.ticket.findMany({ orderBy: { id: "asc" } }),
  ordenes: () => prisma.order.findMany({ select: columnasDeOrden, orderBy: { id: "asc" } }),
  settings: () => prisma.setting.findMany(),
  clubDatos: () => prisma.clubDatos.findMany({ orderBy: { club: "asc" } }),
  clubContacto: () => prisma.clubContacto.findMany({ orderBy: { id: "asc" } }),
  clubSocio: () => prisma.clubSocio.findMany({ orderBy: { id: "asc" } }),
};

for (const [nombre, traer] of Object.entries(tablas)) {
  const filas = await traer();
  writeFileSync(`${destino}/${nombre}.json`, JSON.stringify(filas, null, 1));
  console.log(`${nombre}: ${filas.length}`);
}
console.log(`\nGuardado en ${destino}`);
await prisma.$disconnect();
