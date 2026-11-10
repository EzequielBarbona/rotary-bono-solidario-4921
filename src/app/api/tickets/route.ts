import { NextResponse } from "next/server";
import { getTicketGrid } from "@/lib/tickets";
import { campaniaDeSlug } from "@/lib/campanias";

/*
 * La grilla la sondea cada pantalla de compra abierta, cada 20 segundos y
 * pidiendo los 1000 numeros. Sin cache, veinte personas eligiendo a la vez
 * son sesenta consultas por minuto.
 *
 * Con quince segundos de cache en el CDN, son cuatro por minuto en total,
 * sin importar cuanta gente haya. Que la grilla venga hasta quince
 * segundos atrasada no rompe nada: la reserva es atomica, y si alguien
 * elige un numero que acaban de tomar, la compra falla con su aviso igual
 * que hoy.
 *
 * La campaña va en la query y no en la ruta para que el cache del CDN la
 * distinga: ?campania=camiseta-solidaria y ?campania=polioplus son dos
 * respuestas separadas.
 */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("campania");
  const campania = slug ? campaniaDeSlug(slug) : null;
  if (!campania) {
    return NextResponse.json({ error: "Campaña inválida." }, { status: 400 });
  }

  const tickets = await getTicketGrid(campania);
  return NextResponse.json(
    { tickets },
    {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    }
  );
}
