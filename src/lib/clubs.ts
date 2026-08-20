/*
 * Clubes del Distrito 4921.
 *
 * De aca sale la lista del formulario de compra y el agrupado del ranking.
 * El padron oficial se saca de My Rotary.
 *
 * Mientras el array este vacio el formulario sigue pidiendo el club como
 * texto libre, igual que antes: sin padron no hay forma de saber si lo que
 * alguien escribe es un club del 4921 o de otro distrito, y el ranking
 * quedaria mal agrupado. Cargar la lista enciende el desplegable y, con
 * el, el ranking.
 *
 * Al cargarlos: nombres tal como figuran en el padron del distrito, sin el
 * prefijo "Rotary Club de" (queda implicito y hace la lista ilegible en el
 * celular). Orden alfabetico.
 */
export const DISTRICT_CLUBS: string[] = [];

/** Rotario, pero de un club de otro distrito: el bono circula por WhatsApp y eso no respeta limites. */
export const OTRO_CLUB = "Otro club de Rotary";

/** No es rotario. Suma al total recaudado, no al ranking entre clubes. */
export const SIN_CLUB = "No soy rotario";

export const hayListaDeClubes = () => DISTRICT_CLUBS.length > 0;

export const GRUPO_OTROS = "Otros distritos";
export const GRUPO_AMIGOS = "Amigos de Rotary";

/**
 * A que fila del ranking va una compra. Los clubes del 4921 compiten entre
 * si; el resto se agrupa, para que su aporte se vea sin ensuciar la tabla.
 */
export function grupoDeRanking(club: string | null): string {
  const valor = club?.trim();
  if (!valor || valor === SIN_CLUB) return GRUPO_AMIGOS;
  if (DISTRICT_CLUBS.includes(valor)) return valor;
  return GRUPO_OTROS;
}
