import { dibujarTarjeta } from "@/lib/tarjeta";
import { esVariante, VARIANTES } from "../variantes";

/*
 * La imagen de cada variante de prueba.
 *
 * La ruta termina en .png a proposito: la del sitio es /opengraph-image
 * sin extension, y una de las cosas que estamos probando es justamente si
 * WhatsApp la trata distinto por eso.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ v: string }> }
) {
  const { v } = await params;
  if (!esVariante(v)) {
    return new Response("No existe esa variante.", { status: 404 });
  }
  const { ancho, alto, nota } = VARIANTES[v];
  return dibujarTarjeta({ ancho, alto, etiqueta: `${v} · ${nota}` });
}
