import { RECORDATORIO } from "@/lib/copy";
import { DetalleOrden } from "./DetalleOrden";

/*
 * La pantalla de la orden es toda del navegador: sondea el estado del pago
 * cada un minuto. Pero el texto que se comparte por WhatsApp sale del
 * precio del bono y de la fecha del sorteo, que viven en variables de
 * entorno del servidor, asi que esta pagina existe solo para armarlo aca y
 * pasarlo hecho.
 */
export default async function OrderPage({ params }: PageProps<"/orden/[id]">) {
  const { id } = await params;
  return <DetalleOrden id={id} mensajeParaCompartir={RECORDATORIO} />;
}
