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
