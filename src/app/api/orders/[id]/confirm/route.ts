import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail } from "@/lib/email";
import { isAdminAuthorized } from "@/lib/admin-auth";

/**
 * Confirmacion manual de pago, para usar mientras Mercado Pago no esta
 * conectado (por ejemplo, alguien del subcomite revisa una transferencia y
 * confirma la orden a mano). Requiere sesion de admin (cookie o header
 * x-admin-secret).
 *
 * Cuando este el checkout de Mercado Pago, esto se reemplaza por el webhook
 * de pagos, que va a llamar a esta misma logica de marcar la orden como
 * PAGADO en vez de depender de un humano.
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
    include: { tickets: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
  }
  if (order.status !== "PENDIENTE") {
    return NextResponse.json({ error: `La orden ya está en estado ${order.status}.` }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { status: "PAGADO" } }),
    prisma.ticket.updateMany({
      where: { orderId: order.id },
      data: { status: "VENDIDO" },
    }),
  ]);

  // El pago ya quedo confirmado arriba. Si el mail falla (clave de Resend
  // vencida, dominio sin verificar, Resend caido) no podemos tirar la
  // request abajo: la plata entro y la orden esta paga igual. Avisamos en
  // la respuesta para que el admin sepa que tiene que escribirle a mano.
  let emailSent = false;
  try {
    const result = await sendConfirmationEmail({
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      ticketNumbers: order.tickets.map((t) => t.number),
      totalAmount: order.totalAmount,
      orderId: order.id,
    });
    emailSent = result.sent;
  } catch (err) {
    console.error("[confirm] no se pudo enviar el mail de confirmacion", err);
  }

  return NextResponse.json({ ok: true, emailSent });
}
