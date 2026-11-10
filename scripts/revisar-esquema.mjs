// Revisa, contra las dos URLs de la base, si ya existe la columna campania.
//
// Neon da dos cadenas: la pooleada (DATABASE_URL, la que usa la aplicacion)
// y la directa (DATABASE_URL_UNPOOLED, la que usa prisma db push para el
// DDL). Normalmente son la misma base por dos puertas distintas, pero si
// apuntan a ramas distintas un cambio de esquema puede aplicarse en una y
// no verse en la otra: esto lo dice sin imprimir ninguna credencial.
//
//   node ./scripts/revisar-esquema.mjs
import { readFileSync } from "node:fs";
import pg from "pg";

for (const linea of readFileSync("./.env.local", "utf8").split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(linea.trim());
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

for (const nombre of ["DATABASE_URL", "DATABASE_URL_UNPOOLED"]) {
  const cadena = process.env[nombre];
  if (!cadena) {
    console.log(`${nombre}: no esta en .env.local`);
    continue;
  }

  const u = new URL(cadena);
  console.log(`\n${nombre}: host ${u.hostname}, base ${u.pathname.slice(1)}`);

  const cliente = new pg.Client({ connectionString: cadena });
  try {
    await cliente.connect();
    const { rows } = await cliente.query(
      `select table_name, column_name
         from information_schema.columns
        where table_schema = 'public'
          and column_name = 'campania'
        order by table_name`
    );
    console.log(
      rows.length === 0
        ? "  columna campania: NO existe en ninguna tabla"
        : `  columna campania en: ${rows.map((r) => r.table_name).join(", ")}`
    );

    const { rows: indices } = await cliente.query(
      `select indexname from pg_indexes
        where schemaname = 'public' and tablename = 'Ticket'
        order by indexname`
    );
    console.log(`  indices de Ticket: ${indices.map((r) => r.indexname).join(", ")}`);
  } catch (err) {
    console.log(`  no se pudo consultar: ${err.message}`);
  } finally {
    await cliente.end().catch(() => {});
  }
}
