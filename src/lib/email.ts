import { Resend } from "resend";
import { raffleConfig } from "@/lib/config";
import { formatDrawDate } from "@/lib/format";

type ConfirmationEmailInput = {
  buyerName: string;
  buyerEmail: string;
  ticketNumbers: number[];
  totalAmount: number;
  orderId: number;
};

export async function sendConfirmationEmail(input: ConfirmationEmailInput) {
  const { buyerName, buyerEmail, ticketNumbers, totalAmount, orderId } = input;
  const numbersText = ticketNumbers
    .sort((a, b) => a - b)
    .map((n) => n.toString().padStart(4, "0"))
    .join(", ");

  const subject = `Confirmación de compra - ${raffleConfig.title}`;
  const body = [
    `Hola ${buyerName},`,
    "",
    `Tu compra fue confirmada. Número de orden: ${orderId}.`,
    `Tus números: ${numbersText}`,
    `Monto total: $${totalAmount} ARS`,
    `Fecha del sorteo: ${formatDrawDate(raffleConfig.drawDate)} (por la Lotería Nacional, sorteo nocturno)`,
    "",
    "Gracias por colaborar con PolioPlus - Rotary Distrito 4921.",
  ].join("\n");

  if (!process.env.RESEND_API_KEY) {
    console.log("[email] RESEND_API_KEY no configurada, no se envio email. Contenido:");
    console.log(`Para: ${buyerEmail}\nAsunto: ${subject}\n\n${body}`);
    return { sent: false as const };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Bono Solidario PolioPlus <onboarding@resend.dev>",
    to: buyerEmail,
    subject,
    text: body,
  });

  return { sent: true as const };
}
