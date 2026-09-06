import { NextResponse } from "next/server";
import { getTicketGrid } from "@/lib/tickets";

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
 */
export async function GET() {
  const tickets = await getTicketGrid();
  return NextResponse.json(
    { tickets },
    {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    }
  );
}
