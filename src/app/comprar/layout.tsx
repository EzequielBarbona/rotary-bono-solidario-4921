import Link from "next/link";
import { PurchaseProvider } from "@/lib/purchase-context";
import { CIERRE, estadoDeVenta, GRACIA_MS } from "@/lib/cierre";
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
 */

// Lee el reloj en cada visita: prerenderizada, la pagina quedaria abierta
// para siempre con el HTML del build.
export const dynamic = "force-dynamic";

export default function ComprarLayout({ children }: { children: React.ReactNode }) {
  const estado = estadoDeVenta();

  if (estado === "cerrada") {
    return (
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-16 flex flex-col items-center gap-5 text-center">
        <h1 className="text-3xl font-extrabold text-rotary-ink">La venta cerró</h1>
        <p className="text-base text-rotary-ink/70">
          {CIERRE
            ? `Cerró el ${formatArtDayTime(CIERRE)}. Gracias a todos los que se sumaron al Bono Solidario PolioPlus.`
            : "Gracias a todos los que se sumaron al Bono Solidario PolioPlus."}
        </p>
        <p className="text-sm text-rotary-ink/60">
          Si ya habías comprado, tu orden sigue en pie y el número es tuyo.
        </p>
        <Link
          href="/"
          className="mt-2 bg-rotary-azure text-white font-bold px-8 py-3 rounded-full hover:bg-rotary-azure-dark transition-colors"
        >
          Volver al inicio
        </Link>
      </main>
    );
  }

  return (
    <PurchaseProvider>
      {estado === "gracia" && CIERRE && (
        <div
          role="alert"
          className="bg-rotary-gold/15 border-b border-rotary-gold/40 px-4 py-3"
        >
          <p className="max-w-lg mx-auto text-sm text-rotary-ink text-center">
            <span className="font-bold">La venta cerró a las {horaDe(CIERRE)}.</span>{" "}
            Si ya hiciste la transferencia, terminá ahora: tenemos abierto hasta
            las {horaDe(new Date(CIERRE.getTime() + GRACIA_MS))}.
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
