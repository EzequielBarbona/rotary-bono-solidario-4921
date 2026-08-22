// Argentina no tiene horario de verano, asi que el offset es fijo (UTC-3).
const ART_OFFSET_MS = -3 * 60 * 60 * 1000;

/** Instante UTC que corresponde a la medianoche de "hace `daysAgo` dias" en horario argentino. */
export function startOfArtDay(date: Date, daysAgo = 0): Date {
  const shifted = new Date(date.getTime() + ART_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  shifted.setUTCDate(shifted.getUTCDate() - daysAgo);
  return new Date(shifted.getTime() - ART_OFFSET_MS);
}

/** Instante UTC que corresponde al lunes a medianoche (horario argentino) de la semana de `date`. */
export function startOfArtWeek(date: Date): Date {
  const shifted = new Date(date.getTime() + ART_OFFSET_MS);
  const day = shifted.getUTCDay(); // 0 = domingo ... 6 = sabado
  const daysSinceMonday = (day + 6) % 7;
  return startOfArtDay(date, daysSinceMonday);
}

/** Una semana en milisegundos. Argentina no tiene DST, asi que siempre son 7 dias exactos. */
export const ART_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Formatea una fecha como "dd/mm" en horario argentino. */
export function formatArtDayMonth(date: Date): string {
  const shifted = new Date(date.getTime() + ART_OFFSET_MS);
  const dia = String(shifted.getUTCDate()).padStart(2, "0");
  const mes = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}`;
}

/** Formatea una fecha como "dd/mm/aaaa" en horario argentino. */
export function formatArtDate(date: Date): string {
  const shifted = new Date(date.getTime() + ART_OFFSET_MS);
  const dia = String(shifted.getUTCDate()).padStart(2, "0");
  const mes = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${shifted.getUTCFullYear()}`;
}
