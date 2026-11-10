import { RECORDATORIO } from "@/lib/copy";
import { formatArs } from "@/lib/format";
import { POLIOPLUS, type Campania } from "@/lib/campanias";
import { RUTA_ULTIMOS } from "@/lib/clubs";

/*
 * El mensaje que reenvia por WhatsApp quien ya compro.
 *
 * El del PolioPlus esta escrito a mano en lib/copy.ts, con su gancho, su
 * ecuacion de vacunas y su fecha de sorteo. Las campañas que vengan
 * despues no tienen por que traer un texto escrito a mano para andar: se
 * les arma uno con lo que si tienen cargado —instituciones, premio,
 * precio, sorteo— y se reemplaza por uno propio cuando haga falta.
 */
export function mensajeDeCampania(campania: Campania): string {
  if (campania.slug === POLIOPLUS.slug) return RECORDATORIO;

  const instituciones = campania.instituciones.map((i) => i.nombre);
  const quienes =
    instituciones.length > 1
      ? `${instituciones.slice(0, -1).join(", ")} y ${instituciones.at(-1)}`
      : (instituciones[0] ?? "Rotary");

  return [
    "¿Ya tenés tu número? 🎟️",
    `Bono solidario de ${quienes}.`,
    `Se sortea: ${campania.premio}.`,
    `${formatArs(campania.precioArs)} por número. Lo que se recauda sostiene las acciones solidarias de las dos instituciones en nuestra comunidad.`,
    campania.sorteo,
    "Entrá y comprá el tuyo 👇",
  ]
    .filter(Boolean)
    // Renglon en blanco entre parrafos: en WhatsApp, un bloque corrido no
    // se lee.
    .join("\n\n");
}

/**
 * El link que comparte quien no llego por el link de ningun club.
 *
 * En el PolioPlus es "/ultimos", la entrada de difusion del distrito, que
 * ademas le limpia el club a quien entra. Las demas campañas comparten su
 * propia pagina.
 */
export const rutaDeDifusion = (campania: Campania) =>
  campania.slug === POLIOPLUS.slug ? RUTA_ULTIMOS : campania.ruta;

/** Por que vale la pena compartirlo, en una linea. */
export const textoDeDifusion = (campania: Campania) =>
  campania.slug === POLIOPLUS.slug
    ? "Compartilo con tu gente: cada bono que se venda acerca el objetivo de vacunar chicos contra la polio."
    : "Compartilo con tu gente: cada número que se venda es un aporte concreto para las dos instituciones.";
