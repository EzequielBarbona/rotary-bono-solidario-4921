import { NextResponse } from "next/server";
import { z } from "zod";
import { raffleConfig } from "@/lib/config";
import { ReservationConflictError, reserveTickets } from "@/lib/tickets";
import { estadoDeVenta } from "@/lib/cierre";
import {
  campaniaDeSlug,
  numeroValido,
  ultimoNumero,
  DOCUMENTOS,
  type Campania,
} from "@/lib/campanias";

/*
 * El documento que se pide cambia por campaña —el PolioPlus pidio
 * CUIT/CUIL, la camiseta pide DNI—, asi que el esquema se arma con la
 * campaña ya resuelta. Se guarda siempre en la misma columna: es "el
 * documento de quien transfirio", cualquiera sea.
 */
const fieldsSchemaDe = (campania: Campania) => {
  const doc = DOCUMENTOS[campania.documento];
  return z.object({
    buyerName: z.string().trim().min(2, "Falta el nombre."),
    buyerEmail: z.string().trim().email("Email inválido."),
    buyerPhone: z.string().trim().min(6, "Falta el teléfono."),
    buyerCuit: z
      .string()
      .trim()
      // Se guarda solo en cifras: asi el buscador del panel encuentra
      // igual al que lo escribio con puntos y al que lo escribio sin.
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v.length >= doc.minimo && v.length <= doc.maximo, doc.error),
    buyerClub: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined)),
  });
};

/*
 * El rango lo pone la campaña: el PolioPlus numera del 1 al 1000 y la
 * camiseta del 0 al 999, asi que el esquema se arma con la campaña ya
 * resuelta y no una sola vez al cargar el modulo.
 */
const numbersSchemaDe = (campania: Campania) =>
  z
    .array(
      z
        .number()
        .refine(
          (n) => numeroValido(campania, n),
          `Los números de esta campaña van del ${campania.primerNumero} al ${ultimoNumero(campania)}.`
        )
    )
    .min(1, "Elegí al menos un número.")
    .max(
      raffleConfig.maxTicketsPerOrder,
      `Como máximo se pueden reservar ${raffleConfig.maxTicketsPerOrder} números por compra.`
    );

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  /*
   * De que campaña es la compra. Lo decide el servidor a partir del slug,
   * no el formulario: el precio, el rango de numeros y la hora de cierre
   * salen de aca, asi que un slug que no existe no puede seguir.
   */
  const campania = campaniaDeSlug(String(form.get("campania") ?? ""));
  if (!campania) {
    return NextResponse.json({ error: "Campaña inválida." }, { status: 400 });
  }

  /*
   * El cierre de verdad es este, no el boton: la pantalla puede estar
   * abierta desde antes de la hora, y sin este control una pestaña vieja
   * seguiria reservando numeros el domingo.
   *
   * Durante la media hora de gracia sigue aceptando, para no dejar
   * colgado al que ya transfirio.
   */
  if (estadoDeVenta(campania) === "cerrada") {
    return NextResponse.json(
      {
        error:
          "La venta cerró. Si ya hiciste la transferencia, escribinos y lo resolvemos.",
      },
      { status: 409 }
    );
  }

  let numbers: number[];
  try {
    numbers = numbersSchemaDe(campania).parse(JSON.parse(String(form.get("numbers"))));
  } catch {
    return NextResponse.json({ error: "Números inválidos." }, { status: 400 });
  }

  const parsedFields = fieldsSchemaDe(campania).safeParse({
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
      { error: "Subí una captura del comprobante de transferencia." },
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
      campania,
      numbers,
      ...parsedFields.data,
      // En la venta directa no hay club al que acreditarle el bono: si
      // llegara igual, se descarta aca y no se guarda.
      buyerClub: campania.pideClub ? parsedFields.data.buyerClub : undefined,
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
