import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  CLUB_COOKIE,
  CLUB_COOKIE_MAX_AGE,
  clubDeSlug,
  RUTA_DISTRITO,
  RUTA_ULTIMOS,
  slugDeClub,
} from "@/lib/clubs";

/*
 * Entradas oficiales del distrito a la campaña del PolioPlus. "/sumate"
 * es un alias para difundir: se lee como una invitacion y, al ser una URL
 * que nadie compartio nunca, genera la vista previa de WhatsApp desde
 * cero en cualquier telefono, incluidos los que tienen guardada una
 * version vieja de la raiz. (WhatsApp arma la tarjeta en el telefono que
 * envia y se la guarda por URL, asi que una URL nueva es la unica forma
 * segura de que salga la tarjeta actual.)
 *
 * Las dos limpian el club: quien entra por el canal del distrito no lo
 * invito ningun club.
 */
const ENTRADAS_DISTRITO = new Set([RUTA_DISTRITO, RUTA_ULTIMOS]);

/**
 * La pagina de la campaña del PolioPlus.
 *
 * La raiz dejo de ser esa campaña el dia que aparecio la segunda: ahora
 * es la portada que las lista. Los links que ya circularon —el QR del
 * volante impreso, los /c/<club> de cada club— tienen que seguir cayendo
 * en la campaña, no en la portada.
 */
const PAGINA_POLIOPLUS = "/polioplus";

/** Los pasos de la compra cuando la ruta todavia no llevaba la campaña. */
const PASOS_VIEJOS = new Set(["cantidad", "numeros", "datos"]);

const OPCIONES_COOKIE = {
  path: "/",
  maxAge: CLUB_COOKIE_MAX_AGE,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

/**
 * Entro a esta pagina desde afuera del sitio (un link de WhatsApp, la URL
 * tipeada) y no navegando por adentro.
 *
 * Sec-Fetch-Site lo dice: "none" es una URL abierta directamente y
 * "cross-site" viene de otro dominio; "same-origin" es alguien que ya
 * estaba en el sitio. Si el navegador no manda el header asumimos que es
 * navegacion interna, que es la opcion que no borra nada.
 */
function entraDesdeAfuera(request: NextRequest) {
  const site = request.headers.get("sec-fetch-site");
  const dest = request.headers.get("sec-fetch-dest");
  if (!site) return false;
  if (dest && dest !== "document") return false;
  return site === "none" || site === "cross-site";
}

/**
 * Links de invitacion de club y limpieza del club en las entradas del
 * distrito.
 *
 * /c/cipolletti es una reescritura y no un redirect: WhatsApp arma la
 * vista previa pidiendo el link, y con un redirect de por medio la
 * tarjeta le sale chica. Asi la URL del club devuelve directo el HTML de
 * la home, en un 200 y con sus metadatos.
 *
 * El club queda en una cookie y no en el estado del flujo de compra: ese
 * estado se pierde al recargar y el que ve el flyer hoy puede comprar
 * dentro de un mes.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Los pasos de la compra vivian en /comprar/cantidad, sin campaña en la
   * ruta. Esas URLs quedaron en pestañas abiertas y en el historial de
   * quien compro el bono del PolioPlus: se las manda a su campaña, que es
   * la unica que podian significar.
   */
  const pasoViejo = pathname.slice("/comprar/".length);
  if (PASOS_VIEJOS.has(pasoViejo)) {
    return NextResponse.redirect(
      new URL(`/comprar/polioplus/${pasoViejo}`, request.url)
    );
  }

  if (ENTRADAS_DISTRITO.has(pathname)) {
    // Ni "/sumate" ni "/ultimos" tienen pagina propia: muestran la home
    // de la campaña sin cambiar la URL que la persona tiene a la vista.
    const respuesta = NextResponse.rewrite(new URL(PAGINA_POLIOPLUS, request.url));

    // Se limpia solo si la visita viene de afuera. Desde el paso 1 de la
    // compra el boton "‹ Volver" apunta a la home, y borrar en toda
    // visita le sacaria el club a alguien en plena compra sin que se
    // entere.
    if (entraDesdeAfuera(request) && request.cookies.has(CLUB_COOKIE)) {
      respuesta.cookies.delete({ name: CLUB_COOKIE, path: "/" });
    }
    return respuesta;
  }

  const slug = pathname.split("/")[2] ?? "";
  const club = clubDeSlug(slug);
  const respuesta = NextResponse.rewrite(new URL(PAGINA_POLIOPLUS, request.url));

  if (club) {
    // Se guarda el slug canonico y no lo que vino en la URL: asi
    // /c/CIPOLLETTI y /c/cipolletti dejan exactamente lo mismo.
    respuesta.cookies.set(CLUB_COOKIE, slugDeClub(club), OPCIONES_COOKIE);
  }

  // Un slug que no existe no rompe nada: muestra la home sin acreditarle
  // la visita a nadie, y sin tocar lo que ya hubiera.
  return respuesta;
}

export const config = {
  matcher: [
    "/sumate",
    "/ultimos",
    "/c/:slug",
    "/comprar/cantidad",
    "/comprar/numeros",
    "/comprar/datos",
  ],
};
