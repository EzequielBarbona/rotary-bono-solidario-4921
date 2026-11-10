import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { campaniaDeSlug, POLIOPLUS } from "@/lib/campanias";
import { mensajeDeCampania, rutaDeDifusion, textoDeDifusion } from "@/lib/compartir";
import { DetalleOrden } from "./DetalleOrden";

/*
 * La pantalla de la orden es toda del navegador: sondea el estado del pago
 * cada un minuto. Pero el texto que se comparte por WhatsApp sale del
 * precio del bono y de la fecha del sorteo, y con cual de las dos
 * campañas se compro lo sabe la orden, no la URL: por eso esta pagina
 * existe, para resolver la campaña una vez y pasar todo hecho.
 */

// Consulta la base por el numero de orden: nada que prerenderizar.
export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: PageProps<"/orden/[id]">) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const orden = await prisma.order.findUnique({
    where: { id: orderId },
    select: { campania: true },
  });

  // Si la orden no existe, la pantalla ya sabe decirlo: no hace falta un
  // 404 distinto, y asi el link viejo sigue mostrando el mismo mensaje.
  const campania = (orden && campaniaDeSlug(orden.campania)) ?? POLIOPLUS;

  return (
    <DetalleOrden
      id={id}
      digitos={campania.digitos}
      rutaDifusion={rutaDeDifusion(campania)}
      textoDifusion={textoDeDifusion(campania)}
      mensajeParaCompartir={mensajeDeCampania(campania)}
    />
  );
}
