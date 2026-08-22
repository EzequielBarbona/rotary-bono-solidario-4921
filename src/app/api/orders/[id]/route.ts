import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Datos de una orden para la pantalla que ve el comprador.
 *
 * El select es explicito y corto a proposito: los numeros de orden son
 * correlativos, asi que cualquiera puede pedir /api/orders/7. Devolver la
 * orden entera dejaba salir por ahi el CUIT, el telefono y hasta la
 * imagen del comprobante de transferencia de otra persona.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) {
    return NextResponse.json({ error: "Orden inválida." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      buyerName: true,
      buyerEmail: true,
      buyerClub: true,
      ticketCount: true,
      totalAmount: true,
      status: true,
      tickets: { select: { number: true }, orderBy: { number: "asc" } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
