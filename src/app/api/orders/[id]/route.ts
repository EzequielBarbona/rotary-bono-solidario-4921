import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseExpiredHolds } from "@/lib/tickets";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) {
    return NextResponse.json({ error: "Orden invalida." }, { status: 400 });
  }

  await releaseExpiredHolds();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { tickets: { orderBy: { number: "asc" } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
