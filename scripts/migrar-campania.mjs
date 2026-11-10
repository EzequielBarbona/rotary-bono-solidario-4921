// Agrega la columna campania a Ticket y Order, en una transaccion.
//
// Es exactamente el SQL que imprime
//
//   prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
//
// escrito a mano a proposito: "prisma db push" solo ofrece pasar por arriba
// de sus advertencias con --accept-data-loss, que habilita cualquier cambio
// destructivo que el esquema llegue a pedir. Aca las sentencias estan a la
// vista, son estas seis y ninguna otra, y van todas juntas o ninguna.
//
// Lo que hace, en orden: saca dos indices (indices, no datos), agrega las
// dos columnas con valor por defecto 'polioplus' —asi las 343 ordenes y los
// 1.000 numeros que ya existen quedan donde corresponde— y crea los tres
// indices nuevos, entre ellos el unico de (campania, number): el numero
// pasa a ser unico dentro de su campaña y no en toda la tabla.
//
// Antes de confirmar controla que no se haya perdido ninguna fila y que las
// columnas existan. Si algo no cuadra, hace ROLLBACK y la base queda
// exactamente como estaba.
//
//   node ./scripts/migrar-campania.mjs
import { readFileSync } from "node:fs";
import pg from "pg";

for (const linea of readFileSync("./.env.local", "utf8").split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(linea.trim());
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

// La conexion directa, no la pooleada: Neon recomienda no hacer DDL por el
// pooler (es lo mismo que usa prisma.config.ts).
const cadena = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

const SENTENCIAS = [
  `DROP INDEX IF EXISTS "Ticket_number_key"`,
  `DROP INDEX IF EXISTS "Ticket_status_idx"`,
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "campania" TEXT NOT NULL DEFAULT 'polioplus'`,
  `ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "campania" TEXT NOT NULL DEFAULT 'polioplus'`,
  `CREATE INDEX IF NOT EXISTS "Order_campania_status_idx" ON "Order"("campania", "status")`,
  `CREATE INDEX IF NOT EXISTS "Ticket_campania_status_idx" ON "Ticket"("campania", "status")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_campania_number_key" ON "Ticket"("campania", "number")`,
];

const cliente = new pg.Client({ connectionString: cadena });
await cliente.connect();

const contar = async () => {
  const { rows } = await cliente.query(
    `select (select count(*) from "Ticket") as tickets,
            (select count(*) from "Order") as ordenes`
  );
  return { tickets: Number(rows[0].tickets), ordenes: Number(rows[0].ordenes) };
};

const antes = await contar();
console.log(`Antes: ${antes.tickets} tickets, ${antes.ordenes} ordenes.`);

try {
  await cliente.query("BEGIN");

  for (const sql of SENTENCIAS) {
    console.log(`  ${sql}`);
    await cliente.query(sql);
  }

  const despues = await contar();
  if (despues.tickets !== antes.tickets || despues.ordenes !== antes.ordenes) {
    throw new Error(
      `Cambio la cantidad de filas (${despues.tickets} tickets, ${despues.ordenes} ordenes). Se revierte.`
    );
  }

  const { rows: columnas } = await cliente.query(
    `select table_name from information_schema.columns
      where table_schema = 'public' and column_name = 'campania'
      order by table_name`
  );
  const tablas = columnas.map((r) => r.table_name);
  if (!tablas.includes("Order") || !tablas.includes("Ticket")) {
    throw new Error(`Falta la columna en alguna tabla (quedo en: ${tablas}). Se revierte.`);
  }

  await cliente.query("COMMIT");
  console.log(`\nAplicado. ${despues.tickets} tickets y ${despues.ordenes} ordenes intactos.`);
} catch (err) {
  await cliente.query("ROLLBACK").catch(() => {});
  console.error(`\nNo se aplico nada (ROLLBACK): ${err.message}`);
  process.exitCode = 1;
} finally {
  await cliente.end().catch(() => {});
}
