import { prisma } from "@/lib/prisma";
import { raffleConfig } from "@/lib/config";

/**
 * Libera reservas vencidas (nadie completo el pago a tiempo).
 * Se llama de forma "perezosa" antes de leer/reservar en vez de correr un cron aparte.
 */
export async function releaseExpiredHolds() {
  const cutoff = new Date(Date.now() - raffleConfig.holdMinutes * 60_000);

  const expiredOrders = await prisma.order.findMany({
    where: { status: "PENDIENTE", expiresAt: { lt: new Date() } },
    select: { id: true },
  });
  if (expiredOrders.length === 0) return;

  const expiredIds = expiredOrders.map((o) => o.id);

  await prisma.$transaction([
    prisma.ticket.updateMany({
      where: { orderId: { in: expiredIds }, status: "RESERVADO" },
      data: { status: "DISPONIBLE", orderId: null, reservedAt: null },
    }),
    prisma.order.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: "EXPIRADO" },
    }),
  ]);

  // Referencia a cutoff para dejar explicito el criterio de expiracion usado arriba.
  void cutoff;
}

export async function getTicketGrid() {
  await releaseExpiredHolds();
  const tickets = await prisma.ticket.findMany({
    orderBy: { number: "asc" },
    select: { number: true, status: true },
  });
  return tickets;
}

type ReserveInput = {
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
  await releaseExpiredHolds();

  const {
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
  const now = new Date();
  const expiresAt = new Date(now.getTime() + raffleConfig.holdMinutes * 60_000);
  const totalAmount = uniqueNumbers.length * raffleConfig.ticketPriceArs;

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        buyerName,
        buyerEmail,
        buyerPhone,
        buyerCuit,
        buyerClub: buyerClub || null,
        receiptImage,
        receiptMimeType,
        ticketCount: uniqueNumbers.length,
        totalAmount,
        expiresAt,
        status: "PENDIENTE",
      },
    });

    const result = await tx.ticket.updateMany({
      where: { number: { in: uniqueNumbers }, status: "DISPONIBLE" },
      data: { status: "RESERVADO", orderId: order.id, reservedAt: now },
    });

    if (result.count !== uniqueNumbers.length) {
      // Alguno de los numeros ya no estaba disponible: se aborta la transaccion entera.
      throw new ReservationConflictError();
    }

    return order;
  });
}
