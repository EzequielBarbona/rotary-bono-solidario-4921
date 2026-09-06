/**
 * Recuerda el resultado de una consulta por unos segundos.
 *
 * La home consulta la base en cada visita. Con la campana andando eso son
 * cientos de consultas por minuto pidiendo exactamente el mismo numero, y
 * en Neon el computo se paga por hora encendida: una base que nunca se
 * duerme cuesta todo el dia.
 *
 * Es memoria del proceso, no un cache compartido: cada instancia del
 * servidor tiene la suya y se pierde cuando la instancia se apaga. No es
 * exacto, y no hace falta que lo sea. Una instancia caliente que atiende
 * cien visitas en un minuto hace una sola consulta en vez de cien, y eso
 * es todo lo que buscamos.
 */
type Entrada<T> = { valor: T; vence: number };

const memoria = new Map<string, Entrada<unknown>>();

export async function conMemoriaCorta<T>(
  clave: string,
  consulta: () => Promise<T>,
  segundos = 60
): Promise<T> {
  const guardada = memoria.get(clave) as Entrada<T> | undefined;
  if (guardada && guardada.vence > Date.now()) return guardada.valor;

  const valor = await consulta();
  memoria.set(clave, { valor, vence: Date.now() + segundos * 1000 });
  return valor;
}
