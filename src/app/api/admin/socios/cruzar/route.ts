import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { cruzarSociosConOrdenes } from "@/lib/cruce-socios";

/**
 * Completa teléfono y correo de los socios con los datos de las órdenes.
 *
 * Se puede correr todas las veces que haga falta: solo llena casilleros
 * vacíos. Conviene volver a correrlo después de cargar padrones nuevos o
 * cuando entran compras.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const resultado = await cruzarSociosConOrdenes();
  return NextResponse.json(resultado);
}
