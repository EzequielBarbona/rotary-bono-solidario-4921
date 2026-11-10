import { dibujarTarjeta } from "@/lib/tarjeta";

/*
 * Tarjeta que muestran WhatsApp, Facebook e Instagram cuando alguien pega
 * el link del PolioPlus, sea el de la campaña, el de difusion del
 * distrito o el de cualquier club: /sumate, /ultimos y /c/[slug]
 * reescriben a esta pagina, asi que todos comparten esta imagen.
 *
 * Vivia en la raiz, cuando la raiz era esta campaña. Se mudo acá con
 * ella: en la raiz esta ahora la portada, que lista las dos.
 *
 * El dibujo, y el por que de la forma cuadrada, viven en
 * src/lib/tarjeta.tsx.
 */

export const alt = "Bono Solidario PolioPlus - Distrito Rotary 4921";
export const size = { width: 1200, height: 1200 };
export const contentType = "image/png";

/*
 * Se dibuja en cada pedido y no una vez al desplegar.
 *
 * La tarjeta lleva la cuenta regresiva hasta el cierre: prerenderizada,
 * todo el mundo recibiria el numero del momento del deploy, cada vez mas
 * viejo. Asi el que comparte el link manda el numero de recien.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Image() {
  return dibujarTarjeta({ ancho: size.width, alto: size.height });
}
