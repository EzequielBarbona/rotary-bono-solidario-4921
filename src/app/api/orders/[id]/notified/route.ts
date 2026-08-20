import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/admin-auth";

/**
 * Marca (o desmarca) que un admin ya le aviso al comprador que su pago
 * entro. El aviso se manda a mano por WhatsApp, asi que esto es solo el
 * checklist: sirve para que entre varios administradores no le escriban
 * dos veces a la misma persona ni se olviden de alguien.
 */
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

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, confirmationSentAt: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
  }

  // Se puede desmarcar: si alguien lo apreto por error, tiene que poder
  // volver atras sin pedirle nada a nadie.
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { confirmationSentAt: order.confirmationSentAt ? null : new Date() },
    select: { confirmationSentAt: true },
  });

  return NextResponse.json({
    ok: true,
    confirmationSentAt: updated.confirmationSentAt?.toISOString() ?? null,
  });
}
