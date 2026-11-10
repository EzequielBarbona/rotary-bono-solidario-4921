import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { puedeVer, sesionDePedido } from "@/lib/admin-auth";

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
    select: { campania: true, id: true, confirmationSentAt: true },
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
