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
 * Cuadrada, y no el 1200x630 de manual.
 *
 * Probado en un chat el 22/10/2026 contra La Nacion y YouTube: WhatsApp de
 * escritorio muestra TODAS las vistas previas en formato compacto, con la
 * miniatura al costado del texto, por mas que la imagen sea grande (la de
 * YouTube es de 480x360 y sale igual). O sea que la proporcion no decide
 * entre tarjeta grande y chica, y la creencia anterior —que un 3:2 la
 * degradaba— era leer mal esto mismo.
 *
 * Lo que si decide la proporcion es el recorte: el formato compacto recorta
 * un cuadrado del centro. De una pieza apaisada se come el logo y el pie y
 * deja un pedazo del medio; de una cuadrada no recorta nada y se lee
 * entera. En el telefono, ademas, una cuadrada ocupa mas alto.
 */
export const size = { width: 1200, height: 1200 };
export const contentType = "image/png";

export default async function Image() {
  return dibujarTarjeta({ ancho: size.width, alto: size.height });
}
