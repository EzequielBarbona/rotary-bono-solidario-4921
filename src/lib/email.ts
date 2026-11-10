import { Resend } from "resend";
import type { Campania } from "@/lib/campanias";
import { textosDePanel } from "@/lib/panel-campania";

type ConfirmationEmailInput = {
  /** La campaña de la orden: pone el asunto, el sorteo y el cierre del mail. */
  campania: Campania;
  buyerName: string;
  buyerEmail: string;
  ticketNumbers: number[];
  totalAmount: number;
  orderId: number;
};

export async function sendConfirmationEmail(input: ConfirmationEmailInput) {
  const { campania, buyerName, buyerEmail, ticketNumbers, totalAmount, orderId } =
    input;
  // El sorteo, el agradecimiento y el relleno con ceros son los mismos que
  // usa el aviso de WhatsApp del panel: un comprador no puede recibir dos
  // mensajes que digan cosas distintas.
  const textos = textosDePanel(campania);
  const numbersText = ticketNumbers
    .sort((a, b) => a - b)
    .map((n) => n.toString().padStart(textos.digitos, "0"))
    .join(", ");

  const subject = `Confirmación de compra - ${campania.titulo}`;
  const body = [
    `Hola ${buyerName},`,
    "",
    `Tu compra fue confirmada. Número de orden: ${orderId}.`,
    `Tus números: ${numbersText}`,
    `Monto total: $${totalAmount} ARS`,
    textos.sorteo,
    "",
    textos.gracias,
  ].join("\n");

  if (!process.env.RESEND_API_KEY) {
    console.log("[email] RESEND_API_KEY no configurada, no se envio email. Contenido:");
    console.log(`Para: ${buyerEmail}\nAsunto: ${subject}\n\n${body}`);
    return { sent: false as const };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from:
      process.env.RESEND_FROM_EMAIL ??
      "Bonos solidarios de Rotary <onboarding@resend.dev>",
    to: buyerEmail,
    subject,
    text: body,
  });

  return { sent: true as const };
}
