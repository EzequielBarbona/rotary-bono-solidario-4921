import type { Order } from "@prisma/client";

/**
 * Punto de conexion para el pago. Hoy no hay credenciales de Mercado Pago,
 * asi que devuelve null y la orden queda pendiente hasta que se confirme
 * a mano (ver /api/orders/[id]/confirm) o se conecte el checkout real.
 *
 * Cuando el subcomite tenga la cuenta de Mercado Pago, esta funcion se
 * reemplaza por la creacion de una preferencia de pago (Checkout Pro) y el
 * webhook correspondiente en /api/mercadopago/webhook.
 */
export async function createPaymentLink(order: Order): Promise<string | null> {
  if (!process.env.MP_ACCESS_TOKEN) {
    return null;
  }

  void order;
  throw new Error("Integracion con Mercado Pago todavia no implementada.");
}
