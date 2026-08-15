import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/admin-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) {
    return NextResponse.json({ error: "Orden inválida." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
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
