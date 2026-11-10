import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { puedeVer, sesionDePedido } from "@/lib/admin-auth";

export async function GET(
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
    select: { campania: true, receiptImage: true, receiptMimeType: true },
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

  return new NextResponse(new Uint8Array(order.receiptImage), {
    headers: {
      "Content-Type": order.receiptMimeType,
      // El comprobante de una orden no cambia nunca. Con no-store el
      // navegador volvia a pedir la foto entera en cada recarga del
      // panel, y cada pedido es una lectura de la base.
      "Cache-Control": "private, max-age=86400, immutable",
    },
  });
}
