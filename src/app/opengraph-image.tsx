import { dibujarTarjeta } from "@/lib/tarjeta";

/*
 * Tarjeta que muestran WhatsApp, Facebook e Instagram cuando alguien
 * pega el link del bono, sea el limpio o el de cualquier club: las rutas
 * /c/[slug] reescriben a la home, asi que todas comparten esta imagen.
 *
 * El dibujo vive en src/lib/tarjeta.tsx, porque las pruebas de /pv usan
 * el mismo con otras medidas.
 */

export const alt = "Bono Solidario PolioPlus - Distrito Rotary 4921";

/*
 * 1200x630 (1.91:1). Probamos 3:2 para ganar alto y salio al reves:
 * WhatsApp dejo de mostrar la tarjeta grande y la degrado a la miniatura
 * chiquita al costado del texto. Esta proporcion es la que reconoce.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return dibujarTarjeta({ ancho: size.width, alto: size.height });
}
