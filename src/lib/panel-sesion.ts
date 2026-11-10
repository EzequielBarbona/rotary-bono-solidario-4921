import { CAMPANIAS, POLIOPLUS, campaniaDeSlug, estadoDe, type Campania } from "@/lib/campanias";
import { esMaestra, type SesionAdmin } from "@/lib/admin-auth";

/*
 * Que campaña mira el panel, resuelto en un solo lugar.
 *
 * Con una clave de campaña la respuesta es siempre la suya: el ?campania=
 * de la URL se ignora, porque si no cambiar de campaña seria escribir
 * nueve letras en la barra de direcciones. Con la clave maestra se elige,
 * y por defecto se muestra la que esta vendiendo, que es donde esta el
 * trabajo del dia.
 */

/** Las campañas entre las que puede moverse la clave maestra. */
export const CAMPANIAS_DEL_PANEL = CAMPANIAS;

export function campaniaDelPanel(
  sesion: SesionAdmin,
  pedida: string | string[] | undefined
): { campania: Campania; puedeElegir: boolean } {
  if (!esMaestra(sesion)) {
    const propia = sesion.campania ? campaniaDeSlug(sesion.campania) : null;
    // Una clave configurada para un slug que ya no existe no abre nada
    // util: mejor que caiga en la campaña vieja que en otra ajena.
    return { campania: propia ?? POLIOPLUS, puedeElegir: false };
  }

  const slug = Array.isArray(pedida) ? pedida[0] : pedida;
  const elegida = slug ? campaniaDeSlug(slug) : null;
  const porDefecto = CAMPANIAS.find((c) => estadoDe(c) === "abierta") ?? POLIOPLUS;
  return { campania: elegida ?? porDefecto, puedeElegir: true };
}
