import { raffleConfig } from "@/lib/config";

/**
 * Cuantos chicos se protegen contra la polio con un monto en pesos,
 * ya con el match 2 a 1 de la Fundacion Gates aplicado. Redondea para
 * abajo a proposito: es mejor quedarse corto que exagerar el impacto.
 */
export function childrenProtected(amountArs: number): number {
  const usd = amountArs / raffleConfig.usdArsRate;
  const matchedUsd = usd * raffleConfig.gatesMatchMultiplier;
  return Math.floor(matchedUsd / raffleConfig.costPerChildUsd);
}

/**
 * Para que el pictograma de personitas se vea bien (figuras reconocibles,
 * no una nube de puntos), agrupa varios chicos por figura cuando el total
 * es muy alto en vez de dibujar una figura por cada uno.
 */
export function pictogramScale(
  total: number,
  filled: number,
  maxIcons = 400,
  unitsPerIcon?: number,
) {
  const upi = unitsPerIcon ?? (total <= maxIcons ? 1 : Math.ceil(total / maxIcons));
  if (upi <= 1) {
    return { displayTotal: total, displayFilled: filled, unitsPerIcon: 1 };
  }
  const displayTotal = Math.ceil(total / upi);
  const displayFilled = Math.ceil(filled / upi);
  return { displayTotal, displayFilled, unitsPerIcon: upi };
}
