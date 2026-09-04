import { prisma } from "@/lib/prisma";

/** El ranking por club se ve en la home solo si el subcomite lo publica. */
export const RANKING_PUBLICO = "rankingPublico";

export async function getFlag(key: string): Promise<boolean> {
  // Si la fila no existe el interruptor esta apagado: el default es no
  // mostrar nada de mas en la pagina publica.
  const fila = await prisma.setting.findUnique({ where: { key } });
  return fila?.value === "true";
}

export async function setFlag(key: string, value: boolean): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });
}

/**
 * Prefijo de las claves con el telefono del delegado de cada club:
 * `tel:cipolletti`. Van en la misma tabla de configuracion porque son
 * exactamente eso, un dato suelto del subcomite, y no ameritan un modelo
 * propio con su migracion.
 */
export const TEL_CLUB = "tel:";

/** Telefonos cargados, por slug de club. */
export async function telefonosDeClubes(): Promise<Record<string, string>> {
  const filas = await prisma.setting.findMany({
    where: { key: { startsWith: TEL_CLUB } },
    select: { key: true, value: true },
  });
  return Object.fromEntries(filas.map((f) => [f.key.slice(TEL_CLUB.length), f.value]));
}
