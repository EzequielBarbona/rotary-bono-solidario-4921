import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, sesionDeClave } from "@/lib/admin-auth";

/*
 * El ingreso al panel. La clave decide que se ve: la maestra abre todo el
 * panel y la de una campaña abre solo las compras de esa campaña (ver
 * lib/admin-auth.ts). Por eso hay un solo formulario y no uno por
 * campaña: nadie tiene que elegir "quien soy" antes de escribir la clave.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  const sesion = sesionDeClave(password);
  if (!sesion) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }

  // La cookie guarda la clave, igual que antes: es lo que despues vuelve a
  // resolverse a una sesion. Va httpOnly, asi que el navegador la manda y
  // ningun script de la pagina puede leerla.
  const response = NextResponse.json({ ok: true, campania: sesion.campania });
  response.cookies.set(ADMIN_COOKIE_NAME, password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
