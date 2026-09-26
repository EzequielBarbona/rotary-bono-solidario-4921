import { raffleConfig } from "@/lib/config";
import { RUTA_DISTRITO } from "@/lib/clubs";
import { responderConVolante } from "@/lib/volante";

/*
 * El volante del distrito: el mismo de los clubes pero con el QR del link
 * limpio, que no le acredita la venta a nadie.
 *
 * Es el que se usa cuando el material no sale de un club: una nota, un
 * evento del distrito, un comercio que presta la vidriera. Un club que
 * reparte el suyo en vez de este es lo mismo para la campana y le suma en
 * la copa, asi que el del club sigue siendo el recomendado.
 *
 * La ruta es fija y por eso gana sobre /flyer/[formato], que es la que
 * entrega las piezas de Instagram.
 */
export async function GET(request: Request) {
  return responderConVolante(request, {
    enlace: `${raffleConfig.siteUrl}${RUTA_DISTRITO}`,
    club: null,
    archivo: "bono-polioplus-distrito-4921",
  });
}
