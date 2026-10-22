"use client";

import { RUTA_ULTIMOS } from "@/lib/clubs";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

/*
 * El bono se difunde por WhatsApp, de rotario a rotario y de ahi a los
 * grupos de cada club. Este boton deja el mensaje ya escrito para que
 * reenviarlo sea un toque y nadie tenga que redactar nada.
 */

export function ShareWhatsAppButton({
  label = "Compartir por WhatsApp",
  className = "",
  ruta = RUTA_ULTIMOS,
  mensaje,
}: {
  label?: string;
  className?: string;
  /**
   * Que se comparte. Por defecto el link limpio, que es el de la difusion
   * oficial; desde la orden se pasa el link del club del comprador para
   * que lo que el reparta le sume a ese club.
   */
  ruta?: string;
  /**
   * El texto, armado en el servidor.
   *
   * No se importa RECORDATORIO aca: sale del precio y la fecha del sorteo,
   * que viven en variables de entorno del servidor. En el navegador esas
   * variables no existen y el mensaje saldria diciendo "$0" y "sorteo a
   * definir".
   */
  mensaje: string;
}) {
  function share() {
    // La URL se arma en el click y no en el render para no depender de
    // una variable de entorno ni romper la hidratacion.
    const text = `${mensaje}\n${window.location.origin}${ruta}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex items-center justify-center gap-2 bg-[#25d366] text-white font-bold text-lg px-8 py-4 rounded-full hover:bg-[#1eb455] transition-colors ${className}`}
    >
      <WhatsAppIcon size={22} />
      {label}
    </button>
  );
}
