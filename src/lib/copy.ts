import { raffleConfig } from "@/lib/config";
import { formatArs, formatDrawDate } from "@/lib/format";
import { childrenProtected } from "@/lib/impact";

/*
 * Los textos de la campaña, escritos una sola vez.
 *
 * El volante impreso, las piezas de Instagram, la tarjeta que arma
 * WhatsApp y el mensaje que reenvian los clubes decian lo mismo en cuatro
 * archivos distintos: cambiar el premio era cambiarlo cuatro veces y
 * olvidarse de uno. Estos son los textos del borrador del subcomite
 * (26/9/2026).
 */

/**
 * El gancho. Interpela mejor que "¿Nos ayudas?": al que ya compro lo deja
 * tranquilo y al que no, lo pone en movimiento.
 */
export const GANCHO = "¿Ya tenés tu bono?";

export const LEMA = ["Mantengamos la esperanza", "de un mundo libre de polio"];

/** Cuantos chicos vacuna un bono, con el match de la Fundacion Gates ya aplicado. */
export const CHICOS_POR_BONO = childrenProtected(raffleConfig.ticketPriceArs);

/**
 * "$10.000 = 6 vacunas = 6 vidas": la cuenta que convence de un vistazo.
 *
 * Sale del precio, la cotizacion y el match que usa toda la pagina, asi
 * que el volante no puede quedar diciendo una cifra vieja. Es null
 * mientras no haya precio cargado: un volante que anuncia "$0 = 0 vidas"
 * es peor que uno sin la cuenta.
 */
export const ECUACION =
  raffleConfig.ticketPriceArs > 0 && CHICOS_POR_BONO > 0
    ? `${formatArs(raffleConfig.ticketPriceArs)} = ${CHICOS_POR_BONO} vacunas = ${CHICOS_POR_BONO} vidas`
    : null;

export const MARCA = "Bono Solidario PolioPlus · Distrito 4921";

export const PREMIO = "5 noches para 2 personas, elegí tu destino:";
export const DESTINOS = "Bariloche o Las Grutas";
export const FECHAS_PREMIO = "Del 30 de noviembre al 4 de diciembre";

export const SORTEO = `Sorteo ${formatDrawDate(raffleConfig.drawDate)} por la Lotería Nacional, nocturno`;

/** Lo mismo cortado en dos, para las piezas angostas donde en una linea no entra. */
export const SORTEO_FECHA = `Sorteo ${formatDrawDate(raffleConfig.drawDate)}`;
export const SORTEO_MEDIO = "Por la Lotería Nacional, sorteo nocturno";

export const URGENCIA = "No te quedes afuera de esta campaña que intenta salvar vidas";

export const LLAMADO = "Escaneá y compralo en un minuto";

/**
 * El recordatorio que se manda junto al volante.
 *
 * Corto a proposito: se lee de un vistazo en la notificacion y no obliga a
 * abrir "leer mas". El link lo pega quien comparte, al final.
 */
export const RECORDATORIO = [
  `${GANCHO} 🎟️`,
  "",
  `${MARCA}.`,
  "",
  ECUACION
    ? `${ECUACION}. Con cada bono ayudás a vacunar chicos contra la polio.`
    : "Con cada bono ayudás a vacunar chicos contra la polio.",
  "",
  `Y participás por 5 noches para 2 personas, elegí tu destino: ${DESTINOS}, del 30 de noviembre al 4 de diciembre.`,
  "",
  `${SORTEO}.`,
  "",
  `Entrá ahora y compralo en un minuto. ${URGENCIA} 👇`,
].join("\n");
