import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { puedeVer, sesionDePedido } from "@/lib/admin-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await sesionDePedido(request);
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) {
    return NextResponse.json({ error: "Orden inválida." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { campania: true, id: true, status: true },
  });
  /*
   * La orden existe pero puede ser de la otra campaña. Los numeros de
   * orden son correlativos y estan a la vista en el panel, asi que sin
   * este control la clave de una campaña alcanzaba para operar sobre las
   * compras de la otra cambiando un numero en la URL.
   *
   * Responde "no encontrada" y no "no autorizado": asi tampoco se puede
   * averiguar cuantas ordenes tiene la otra campaña.
   */
  if (!order || !puedeVer(sesion, order.campania)) {
    return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
  }
  if (order.status === "CANCELADO" || order.status === "EXPIRADO") {
    return NextResponse.json(
      { error: `La orden ya está en estado ${order.status}.` },
      { status: 409 }
    );
  }

  await prisma.$transaction([
    prisma.ticket.updateMany({
      where: { orderId: order.id },
      data: { status: "DISPONIBLE", orderId: null, reservedAt: null },
    }),
    prisma.order.update({ where: { id: order.id }, data: { status: "CANCELADO" } }),
  ]);

  return NextResponse.json({ ok: true });
}
