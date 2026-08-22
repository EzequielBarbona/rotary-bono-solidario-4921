import { NextResponse } from "next/server";
import { CLUB_COOKIE, CLUB_COOKIE_MAX_AGE, clubDeSlug, slugDeClub } from "@/lib/clubs";

/**
 * Link de invitacion de un club: /c/cipolletti.
 *
 * Deja el club en una cookie y manda a la home. A partir de ahi la
 * compra se le acredita a ese club aunque el comprador no sea rotario y
 * no tenga idea de a que club pertenece nadie.
 *
 * Va en una cookie y no en el estado del flujo de compra porque ese
 * estado se pierde al recargar: el que ve el flyer hoy y compra la
 * semana que viene tiene que seguir sumandole al mismo club.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const club = clubDeSlug(slug);

  const respuesta = NextResponse.redirect(new URL("/", request.url));

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

  // Un slug que no existe no rompe nada: se lo trata como link limpio.
  return respuesta;
}
