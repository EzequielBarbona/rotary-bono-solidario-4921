import { NextResponse } from "next/server";
import { z } from "zod";
import { raffleConfig } from "@/lib/config";
import { ReservationConflictError, reserveTickets } from "@/lib/tickets";

const fieldsSchema = z.object({
  buyerName: z.string().trim().min(2, "Falta el nombre."),
  buyerEmail: z.string().trim().email("Email invalido."),
  buyerPhone: z.string().trim().min(6, "Falta el telefono."),
  buyerCuit: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 11, "El CUIT/CUIL debe tener 11 numeros."),
  buyerClub: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

const numbersSchema = z
  .array(z.number().int().min(1).max(raffleConfig.totalTickets))
  .min(1, "Elegi al menos un numero.")
  .max(
    raffleConfig.maxTicketsPerOrder,
    `Como maximo se pueden reservar ${raffleConfig.maxTicketsPerOrder} numeros por compra.`
  );

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Solicitud invalida." }, { status: 400 });
  }

  let numbers: number[];
  try {
    numbers = numbersSchema.parse(JSON.parse(String(form.get("numbers"))));
  } catch {
    return NextResponse.json({ error: "Numeros invalidos." }, { status: 400 });
  }

  const parsedFields = fieldsSchema.safeParse({
    buyerName: form.get("buyerName"),
    buyerEmail: form.get("buyerEmail"),
    buyerPhone: form.get("buyerPhone"),
    buyerCuit: form.get("buyerCuit"),
    buyerClub: form.get("buyerClub") ?? undefined,
  });
  if (!parsedFields.success) {
    return NextResponse.json(
      { error: parsedFields.error.issues.map((i) => i.message).join(" ") },
      { status: 400 }
    );
  }

  const receipt = form.get("receipt");
  if (!(receipt instanceof File) || receipt.size === 0) {
    return NextResponse.json(
      { error: "Subi una captura del comprobante de transferencia." },
      { status: 400 }
    );
  }
  if (!receipt.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "El comprobante tiene que ser una imagen." },
      { status: 400 }
    );
  }
  if (receipt.size > raffleConfig.maxReceiptSizeBytes) {
    return NextResponse.json(
      { error: "La imagen del comprobante es demasiado pesada." },
      { status: 400 }
    );
  }

  const receiptImage = new Uint8Array(await receipt.arrayBuffer());

  try {
    const order = await reserveTickets({
      numbers,
      ...parsedFields.data,
      receiptImage,
      receiptMimeType: receipt.type,
    });
    return NextResponse.json({ orderId: order.id, expiresAt: order.expiresAt });
  } catch (error) {
    if (error instanceof ReservationConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: "No se pudo procesar la reserva." }, { status: 500 });
  }
}
