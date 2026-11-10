import { formatDrawDate } from "@/lib/format";
import { raffleConfig } from "@/lib/config";
import { DOCUMENTOS, POLIOPLUS, type Campania } from "@/lib/campanias";
import { RUTA_DISTRITO } from "@/lib/clubs";

/*
 * Lo que el panel necesita saber de la campaña para hablarle al
 * comprador.
 *
 * El aviso de "pago confirmado" lo manda un admin por WhatsApp con el
 * texto ya escrito. Ese texto nombraba la campaña, la Loteria Nacional y
 * la polio a mano: con dos campañas, el comprador de la camiseta recibia
 * un mensaje que hablaba de vacunas. Esto lo arma por campaña, en el
 * servidor, y se lo pasa hecho a la tarjeta de la orden.
 */

export type TextosDePanel = {
  /** Como se nombra la campaña en el mensaje: "el Bono Solidario...". */
  nombre: string;
  /** Con cuantos ceros se escribe un numero: "0001" o "000". */
  digitos: number;
  /** Como se llama el documento que pidio esta campaña: "DNI", "CUIT/CUIL". */
  documento: string;
  /** El renglon del sorteo, ya redactado. */
  sorteo: string;
  /** El agradecimiento del final. */
  gracias: string;
  /** El link que se comparte cuando el comprador no llego por un club. */
  rutaDifusion: string;
  /**
   * Si se le explica que el link lleva el codigo de su club.
   *
   * Solo en el PolioPlus, que lo vendieron los 119 clubes del distrito y
   * tiene una copa entre clubes. En la venta directa no hay nada que
   * acreditar y la explicacion solo confundiria.
   */
  copaClubes: boolean;
};

export function textosDePanel(campania: Campania): TextosDePanel {
  if (campania.slug === POLIOPLUS.slug) {
    return {
      nombre: "el Bono Solidario PolioPlus del Distrito 4921",
      digitos: campania.digitos,
      documento: DOCUMENTOS[campania.documento].etiqueta,
      sorteo: `El sorteo es el ${formatDrawDate(raffleConfig.drawDate)}, por la Lotería Nacional, sorteo nocturno.`,
      gracias: "¡Gracias por colaborar para erradicar la polio!",
      rutaDifusion: RUTA_DISTRITO,
      copaClubes: true,
    };
  }

  const instituciones = campania.instituciones.map((i) => i.nombre);
  const quienes =
    instituciones.length > 1
      ? `${instituciones.slice(0, -1).join(", ")} y ${instituciones.at(-1)}`
      : (instituciones[0] ?? "Rotary");

  return {
    nombre: `el bono solidario de ${quienes}`,
    digitos: campania.digitos,
    documento: DOCUMENTOS[campania.documento].etiqueta,
    // Mientras no haya fecha, el texto de la campaña ya dice "a
    // confirmar": es mejor eso que prometer una fecha que no existe.
    sorteo: campania.sorteo ?? "Te avisamos la fecha del sorteo en cuanto esté confirmada.",
    gracias: "¡Gracias por acompañar esta campaña solidaria!",
    rutaDifusion: campania.ruta,
    copaClubes: false,
  };
}
