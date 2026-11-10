import Link from "next/link";
import { notFound } from "next/navigation";
import { PurchaseProvider } from "@/lib/purchase-context";
import { cierreDe, estadoDeVenta, GRACIA_MS } from "@/lib/cierre";
import { campaniaDeSlug } from "@/lib/campanias";
import { formatArtDayTime } from "@/lib/dates";

/*
 * Los tres pasos de la compra se cierran acá, en un solo lugar, y no paso
 * por paso.
 *
 * Despues de la hora el flujo no se corta de golpe: hay media hora de
 * gracia para el que ya estaba comprando, porque el comprobante se sube
 * junto con la reserva y entre elegir los numeros y sacarle la captura a
 * la transferencia pasan varios minutos. Lo que no puede pasar es que
 * alguien transfiera y se quede sin bono.
 *
 * La campaña va en la ruta (/comprar/camiseta-solidaria/cantidad) y no en
 * una cookie: asi el link se puede compartir, dos pestañas de dos
 * campañas distintas no se pisan, y el precio que se cobra se lee en la
 * barra de direcciones.
 */

// Lee el reloj en cada visita: prerenderizada, la pagina quedaria abierta
// para siempre con el HTML del build.
export const dynamic = "force-dynamic";

/*
 * El titulo de la pestaña, el de la campaña que se esta comprando.
 *
 * Sin esto hereda el del layout raiz, que es el del PolioPlus: quien
 * compraba la camiseta tenia abierta una pestaña que decia "Bono
 * Solidario PolioPlus" mientras cargaba sus datos y transferia.
 */
export async function generateMetadata({ params }: LayoutProps<"/comprar/[campania]">) {
  const { campania: slug } = await params;
  const campania = campaniaDeSlug(slug);
  return { title: campania ? `Comprar · ${campania.nombreCorto}` : "Comprar" };
}

export default async function ComprarLayout({
  children,
  params,
}: LayoutProps<"/comprar/[campania]">) {
  const { campania: slug } = await params;
  const campania = campaniaDeSlug(slug);
  if (!campania) notFound();

  const estado = estadoDeVenta(campania);
  const cierre = cierreDe(campania);

  if (estado === "cerrada") {
    return (
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-16 flex flex-col items-center gap-5 text-center">
        <h1 className="text-3xl font-extrabold text-rotary-ink">
          {campania.publicada ? "La venta cerró" : "La venta todavía no abrió"}
        </h1>
        <p className="text-base text-rotary-ink/70">
          {!campania.publicada
            ? `La venta de ${campania.premio.toLowerCase()} abre en los próximos días.`
            : cierre
              ? `Cerró el ${formatArtDayTime(cierre)}. Gracias a todos los que se sumaron.`
              : "Gracias a todos los que se sumaron."}
        </p>
        {campania.publicada && (
          <p className="text-sm text-rotary-ink/60">
            Si ya habías comprado, tu orden sigue en pie y el número es tuyo.
          </p>
        )}
        <Link
          href={campania.ruta}
          className="mt-2 bg-rotary-azure text-white font-bold px-8 py-3 rounded-full hover:bg-rotary-azure-dark transition-colors"
        >
          Volver a la campaña
        </Link>
      </main>
    );
  }

  return (
    <PurchaseProvider>
      {estado === "gracia" && cierre && (
        <div
          role="alert"
          className="bg-rotary-gold/15 border-b border-rotary-gold/40 px-4 py-3"
        >
          <p className="max-w-lg mx-auto text-sm text-rotary-ink text-center">
            <span className="font-bold">La venta cerró a las {horaDe(cierre)}.</span>{" "}
            Si ya hiciste la transferencia, terminá ahora: tenemos abierto hasta
            las {horaDe(new Date(cierre.getTime() + GRACIA_MS))}.
          </p>
        </div>
      )}
      {children}
    </PurchaseProvider>
  );
}

/** Solo la hora de un instante, en horario argentino: "18:30". */
function horaDe(fecha: Date) {
  return formatArtDayTime(fecha).split("a las ")[1] ?? "";
}
