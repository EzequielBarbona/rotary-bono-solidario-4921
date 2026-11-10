import { dibujarTarjetaDeCampania } from "@/lib/tarjeta-campania";
import { CAMPANIAS, POLIOPLUS, estadoDe } from "@/lib/campanias";

/*
 * Tarjeta que muestran WhatsApp, Facebook e Instagram cuando alguien pega
 * el link pelado del sitio.
 *
 * La raiz dejo de ser una campaña el dia que aparecio la segunda: ahora
 * es la portada que las lista. Pero una portada no se comparte, se
 * comparte "el bono": asi que la tarjeta es la de la campaña que esta
 * vendiendo, que es a la que va a ir el que toque el link. La del
 * PolioPlus se mudo con su pagina a /polioplus.
 */

export const alt = "Bonos solidarios de Rotary";
export const size = { width: 1200, height: 1200 };
export const contentType = "image/png";

// Cual es la campaña abierta puede cambiar sin que nadie despliegue nada:
// se decide en cada pedido.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Image() {
  const abierta = CAMPANIAS.find((c) => estadoDe(c) === "abierta");
  return dibujarTarjetaDeCampania(abierta ?? POLIOPLUS, {
    ancho: size.width,
    alto: size.height,
  });
}
