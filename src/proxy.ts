import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CLUB_COOKIE, CLUB_COOKIE_MAX_AGE, clubDeSlug, slugDeClub } from "@/lib/clubs";

/**
 * Link de invitacion de un club: /c/cipolletti.
 *
 * Es una reescritura y no un redirect. WhatsApp y Facebook piden el link
 * para armar la vista previa, y con un redirect de por medio la tarjeta
 * les sale chica: asi la URL del club devuelve directo el HTML de la home,
 * con su imagen y sus metadatos, en un 200 y sin saltos.
 *
 * El club queda en una cookie, no en el estado del flujo de compra: ese
 * estado se pierde al recargar y el que ve el flyer hoy puede comprar
 * dentro de un mes.
 */
export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2] ?? "";
  const club = clubDeSlug(slug);

  const respuesta = NextResponse.rewrite(new URL("/", request.url));

  if (club) {
    // Se guarda el slug canonico y no lo que vino en la URL: asi
    // /c/CIPOLLETTI y /c/cipolletti dejan exactamente lo mismo.
    respuesta.cookies.set(CLUB_COOKIE, slugDeClub(club), {
      path: "/",
      maxAge: CLUB_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  // Un slug que no existe no rompe nada: muestra la home sin acreditarle
  // la visita a nadie.
  return respuesta;
}

export const config = {
  matcher: "/c/:slug",
};
