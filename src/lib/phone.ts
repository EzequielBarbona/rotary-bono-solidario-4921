/*
 * Los telefonos los escribe cada comprador a mano, asi que llegan de
 * todas las formas: "299 4736968", "+54 9 299 473-6968", "02994736968",
 * "0299 15 4736968". WhatsApp necesita solo digitos con codigo de pais.
 */

/** Un celular argentino sin 0 ni 15 tiene 10 digitos: area + abonado. */
const DIGITOS_SIN_PREFIJOS = 10;

/**
 * Normaliza un telefono argentino al formato que espera wa.me
 * (54 9 + area + abonado, sin espacios ni signos).
 *
 * Si el numero no encaja en el formato esperado devuelve null: es
 * preferible no ofrecer el boton antes que abrir un chat con un numero
 * equivocado.
 */
export function toWhatsAppNumber(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (!d) return null;

  // Prefijo internacional, 0 de larga distancia y el 9 de celular: los
  // sacamos para quedarnos siempre con area + abonado y reconstruir.
  if (d.startsWith("54")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.startsWith("9")) d = d.slice(1);

  // El 15 va despues del codigo de area, que puede tener 2, 3 o 4
  // digitos. Solo lo sacamos si al hacerlo el numero queda del largo
  // correcto, para no mutilar un numero que casualmente tenga un 15.
  if (d.length === DIGITOS_SIN_PREFIJOS + 2) {
    for (const largoArea of [2, 3, 4]) {
      if (d.slice(largoArea, largoArea + 2) === "15") {
        d = d.slice(0, largoArea) + d.slice(largoArea + 2);
        break;
      }
    }
  }

  if (d.length !== DIGITOS_SIN_PREFIJOS) return null;
  return `549${d}`;
}
