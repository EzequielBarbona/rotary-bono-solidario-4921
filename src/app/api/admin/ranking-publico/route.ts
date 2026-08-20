import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { RANKING_PUBLICO, setFlag } from "@/lib/settings";

/**
 * Publica o esconde el ranking por club en la pagina principal.
 *
 * Es una decision del subcomite y no del codigo: al principio la tabla
 * esta casi vacia y mostrarla desanima, mas adelante es justamente lo que
 * empuja a los clubes a vender.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const visible = body?.visible;
  if (typeof visible !== "boolean") {
    return NextResponse.json({ error: "Falta indicar visible." }, { status: 400 });
  }

  await setFlag(RANKING_PUBLICO, visible);
  return NextResponse.json({ ok: true, visible });
}
