import type { Campania } from "@/lib/campanias";

/*
 * Cuando cierra la venta de una campaña, en un solo lugar.
 *
 * La hora que muestra la cuenta regresiva, la que apaga el boton de
 * comprar y la que rechaza una reserva tienen que ser la misma: si cada
 * pantalla la calculara por su cuenta, alguien podria ver el boton
 * prendido y comerse un error al apretar.
 *
 * Desde que el sitio tiene mas de una campaña, todo esto recibe la
 * campaña: el PolioPlus cerro el 24/10 y la camiseta sigue abierta, asi
 * que una hora de cierre global cerraria la venta que esta corriendo.
 */

/** El instante del cierre de esa campaña, o null si no tiene fecha cargada. */
export function cierreDe(campania: Campania): Date | null {
  if (!campania.cierreAt) return null;
  const fecha = new Date(campania.cierreAt);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/**
 * Media hora de gracia despues del cierre.
 *
 * El comprobante se sube junto con la reserva, no despues: entre que
 * alguien elige los numeros, completa sus datos, abre el homebanking,
 * transfiere y saca la captura pasan varios minutos. Sin esta ventana, el
 * que arranco 17:55 y transfirio 18:05 se queda con la plata mandada y
 * sin bono, que es el unico desenlace que no podemos permitir.
 *
 * Durante la gracia la venta ya no se ofrece en ningun lado: solo se deja
 * terminar lo que ya estaba empezado.
 */
export const GRACIA_MS = 30 * 60 * 1000;

export type EstadoDeVenta = "abierta" | "gracia" | "cerrada";

export function estadoDeVenta(
  campania: Campania,
  ahora: number = Date.now()
): EstadoDeVenta {
  // Una campaña sin publicar no vende, aunque no tenga fecha de cierre:
  // es el interruptor con el que se la anuncia antes de abrirla.
  if (!campania.publicada) return "cerrada";
  const cierre = cierreDe(campania);
  if (!cierre) return "abierta";
  const hora = cierre.getTime();
  if (ahora < hora) return "abierta";
  if (ahora < hora + GRACIA_MS) return "gracia";
  return "cerrada";
}

/** La venta ya no se ofrece: el boton de comprar se apaga. */
export function ventaCerrada(campania: Campania, ahora?: number) {
  return estadoDeVenta(campania, ahora) !== "abierta";
}

const plural = (n: number, singular: string, plural: string) =>
  `${n} ${n === 1 ? singular : plural}`;

/**
 * Cuanto falta, en palabras y corto: "1 día y 22 horas", "23 horas".
 *
 * Para la tarjeta de WhatsApp, que es una imagen y no puede ir corriendo.
 * Va sin el "Faltan" adelante porque en la tarjeta eso ya lo dice el
 * titulo, y corto porque entra en una sola linea en letra grande.
 *
 * Redondea siempre para abajo a proposito: si el numero se queda viejo
 * —WhatsApp guarda la vista previa por link en el telefono del que la
 * mando— es preferible que prometa menos tiempo del que hay y no mas.
 * Al lado va siempre la fecha de cierre, que no se vence nunca.
 */
export function tiempoQueFalta(
  campania: Campania,
  ahora: number = Date.now()
): string | null {
  const cierre = cierreDe(campania);
  if (!cierre) return null;
  const restante = cierre.getTime() - ahora;
  if (restante <= 0) return null;

  const minutos = Math.floor(restante / 60_000);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (dias >= 1) {
    return `${plural(dias, "día", "días")} y ${plural(horas % 24, "hora", "horas")}`;
  }
  if (horas >= 1) return plural(horas, "hora", "horas");
  if (minutos >= 1) return plural(minutos, "minuto", "minutos");
  return "menos de un minuto";
}
