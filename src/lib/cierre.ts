import { raffleConfig } from "@/lib/config";

/*
 * Cuando cierra la venta, en un solo lugar.
 *
 * La hora que muestra la cuenta regresiva, la que apaga el boton de
 * comprar y la que rechaza una reserva tienen que ser la misma: si cada
 * pantalla la calculara por su cuenta, alguien podria ver el boton
 * prendido y comerse un error al apretar.
 */

/** El instante del cierre, o null si no hay fecha cargada. */
export const CIERRE = (() => {
  if (!raffleConfig.salesCloseAt) return null;
  const fecha = new Date(raffleConfig.salesCloseAt);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
})();

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

export function estadoDeVenta(ahora: number = Date.now()): EstadoDeVenta {
  if (!CIERRE) return "abierta";
  const cierre = CIERRE.getTime();
  if (ahora < cierre) return "abierta";
  if (ahora < cierre + GRACIA_MS) return "gracia";
  return "cerrada";
}

/** La venta ya no se ofrece: el boton de comprar se apaga. */
export function ventaCerrada(ahora?: number) {
  return estadoDeVenta(ahora) !== "abierta";
}

const plural = (n: number, singular: string, plural: string) =>
  `${n} ${n === 1 ? singular : plural}`;

/**
 * Cuanto falta, en palabras: "Faltan 1 día y 23 horas".
 *
 * Para la tarjeta de WhatsApp, que es una imagen y no puede ir corriendo.
 * Redondea siempre para abajo a proposito: si el numero se queda viejo
 * —WhatsApp guarda la vista previa por link en el telefono del que la
 * mando— es preferible que prometa menos tiempo del que hay y no mas.
 * Abajo va siempre la fecha de cierre, que no se vence nunca.
 */
export function faltanEnPalabras(ahora: number = Date.now()): string | null {
  if (!CIERRE) return null;
  const restante = CIERRE.getTime() - ahora;
  if (restante <= 0) return null;

  const minutos = Math.floor(restante / 60_000);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (dias >= 1) {
    return `Faltan ${plural(dias, "día", "días")} y ${plural(horas % 24, "hora", "horas")}`;
  }
  if (horas >= 1) {
    return `Faltan ${plural(horas, "hora", "horas")} y ${plural(minutos % 60, "minuto", "minutos")}`;
  }
  if (minutos >= 1) return `Faltan ${plural(minutos, "minuto", "minutos")}`;
  return "Últimos minutos";
}
