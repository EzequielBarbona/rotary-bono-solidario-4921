import { dibujarTarjetaDeCampania } from "@/lib/tarjeta-campania";
import { campaniaDeSlug, POLIOPLUS } from "@/lib/campanias";

/*
 * Tarjeta que muestran WhatsApp, Facebook e Instagram cuando alguien pega
 * el link de la camiseta.
 *
 * Sin este archivo la campaña heredaba la tarjeta de la raiz, que es la
 * del PolioPlus: el link de la camiseta salia con el logo de End Polio y
 * un cartel de "La venta cerró". Y WhatsApp guarda la vista previa por
 * URL en el telefono del que la manda, asi que una tarjeta equivocada que
 * empieza a circular no se corrige mas.
 */

export const alt =
  "Bono solidario de Rotary Club de Neuquén y Asociación Moiru: camiseta del Club Cipolletti talle S firmada por los jugadores";
export const size = { width: 1200, height: 1200 };
export const contentType = "image/png";

// Lo que dice depende de si la venta sigue abierta: se dibuja en cada
// pedido y no una vez al desplegar.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Image() {
  const campania = campaniaDeSlug("camiseta-solidaria") ?? POLIOPLUS;
  return dibujarTarjetaDeCampania(campania, {
    ancho: size.width,
    alto: size.height,
  });
}
