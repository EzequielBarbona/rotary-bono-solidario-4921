import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { raffleConfig } from "@/lib/config";
import type { Campania } from "@/lib/campanias";

/*
 * Las reservas no vencen solas. Antes se liberaban a las 72 h, pero eso
 * soltaba numeros de gente que si habia pagado y todavia no habiamos
 * confirmado. Ahora una reserva solo se libera si un admin la da de baja
 * desde el panel.
 *
 * Todo lo de aca va por campaña: el 7 del PolioPlus y el 007 de la
 * camiseta son dos bonos distintos, y el precio lo pone cada campaña.
 */

export async function getTicketGrid(campania: Campania) {
  const tickets = await prisma.ticket.findMany({
    where: { campania: campania.slug },
    orderBy: { number: "asc" },
    select: { number: true, status: true },
  });
  return tickets;
}

type ReserveInput = {
  campania: Campania;
  numbers: number[];
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerCuit: string;
  buyerClub?: string;
  receiptImage: Uint8Array<ArrayBuffer>;
  receiptMimeType: string;
};

export class ReservationConflictError extends Error {
  constructor() {
    super("Uno o más números elegidos ya no están disponibles.");
    this.name = "ReservationConflictError";
  }
}

/**
 * Reserva los numeros elegidos de forma atomica: si otro comprador ya tomo
 * alguno de esos numeros justo antes, la transaccion falla entera y no se
 * cobra ni reserva nada a medias.
 */
export async function reserveTickets(input: ReserveInput) {
  const {
    campania,
    numbers,
    buyerName,
    buyerEmail,
    buyerPhone,
    buyerCuit,
    buyerClub,
    receiptImage,
    receiptMimeType,
  } = input;
  const uniqueNumbers = Array.from(new Set(numbers));
  // Huella del comprobante: no bloquea la compra, solo deja rastro para
  // que el panel avise si dos ordenes subieron el mismo archivo. Bloquear
  // aca seria peor: una foto legitima repetida por error dejaria a un
  // comprador afuera sin que nadie se entere.
  const receiptHash = createHash("sha256").update(receiptImage).digest("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + raffleConfig.holdMinutes * 60_000);
  // El precio sale de la campaña y no del entorno: el bono del PolioPlus
  // sale $10.000 y el de la camiseta $2.000, y las dos ventas conviven.
  const totalAmount = uniqueNumbers.length * campania.precioArs;

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        campania: campania.slug,
        buyerName,
        buyerEmail,
        buyerPhone,
        buyerCuit,
        buyerClub: buyerClub || null,
        receiptImage,
        receiptMimeType,
        receiptHash,
        ticketCount: uniqueNumbers.length,
        totalAmount,
        expiresAt,
        status: "PENDIENTE",
      },
    });

    const result = await tx.ticket.updateMany({
      // El filtro por campaña es parte de la seguridad, no una comodidad:
      // sin el, una compra de la camiseta reservaria el numero del
      // PolioPlus que lleve el mismo valor.
      where: {
        campania: campania.slug,
        number: { in: uniqueNumbers },
        status: "DISPONIBLE",
      },
      data: { status: "RESERVADO", orderId: order.id, reservedAt: now },
    });

    if (result.count !== uniqueNumbers.length) {
      // Alguno de los numeros ya no estaba disponible: se aborta la transaccion entera.
      throw new ReservationConflictError();
    }

    return order;
  });
}
