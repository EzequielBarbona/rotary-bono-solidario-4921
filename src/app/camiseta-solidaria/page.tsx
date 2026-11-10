import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContadorBonos } from "@/components/ContadorBonos";
import { campaniaDeSlug, estadoDe, rangoDe, rutaDeCompra } from "@/lib/campanias";
import { ventasDe } from "@/lib/ventas-campania";
import { formatArs } from "@/lib/format";

/*
 * La campaña de la camiseta: Rotary Club de Neuquen con la Asociacion
 * Moiru.
 *
 * Venta directa, sin club al que acreditarle el bono: el formulario de
 * compra de esta campaña no lleva ese campo.
 */

export const dynamic = "force-dynamic";

const SLUG = "camiseta-solidaria";

/*
 * El titulo y la bajada van tambien en openGraph, y no solo en metadata:
 * lo que WhatsApp pone arriba de la imagen sale de ahi. Sin esto hereda
 * los del layout raiz —los del PolioPlus— y el link de la camiseta se
 * comparte anunciando la campaña equivocada.
 */
const TITULO = "Dos instituciones. Una comunidad. Un mismo compromiso: ayudar.";
const BAJADA =
  "Bono solidario de Rotary Club de Neuquén y la Asociación Moiru. Sorteamos una camiseta autografiada del Club Cipolletti.";

export const metadata = {
  title: TITULO,
  description: BAJADA,
  openGraph: {
    type: "website" as const,
    locale: "es_AR",
    url: "/camiseta-solidaria",
    siteName: "Rotary Club de Neuquén · Asociación Moiru",
    title: TITULO,
    description: BAJADA,
  },
  twitter: { card: "summary_large_image" as const, title: TITULO, description: BAJADA },
};

/*
 * El texto de la campaña, tal como lo escribieron las dos instituciones.
 * Va aca y no en lib/copy.ts porque ese archivo es el del PolioPlus: dos
 * campañas distintas no comparten los textos.
 */
const PARRAFOS = [
  "Rotary Club de Neuquén y Asociación Moiru unen esfuerzos en esta iniciativa solidaria con el objetivo de recaudar fondos para sostener y fortalecer las acciones sociales, comunitarias y solidarias que ambas instituciones vienen desarrollando en nuestra comunidad.",
  "En esta oportunidad, ponemos a disposición una camiseta autografiada del Club Cipolletti, un premio que representa también el espíritu de encuentro, identidad y compromiso con nuestra región.",
  "Cada número adquirido representa mucho más que una posibilidad de ganar: es una contribución concreta para acompañar a quienes más lo necesitan, impulsar proyectos comunitarios y continuar generando oportunidades para mejorar la calidad de vida de nuestros vecinos.",
];

const CIERRE_TEXTO =
  "Porque cuando las instituciones trabajan juntas y la comunidad se involucra, las buenas acciones se multiplican.";

export default async function CamisetaSolidaria() {
  const campania = campaniaDeSlug(SLUG);
  if (!campania) notFound();

  const vendido = await ventasDe(SLUG);
  const estado = estadoDe(campania);
  const abierta = estado === "abierta";

  return (
    <main className="flex-1 flex flex-col">
      <section
        className="relative overflow-hidden text-white"
        style={{ background: campania.paleta.fondo }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full border-[24px] border-white/10"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -left-16 bottom-[-6rem] w-56 h-56 rounded-full border-[16px] border-white/10"
        />

        <div className="relative max-w-3xl w-full mx-auto px-4 pt-8 sm:pt-12 pb-12 sm:pb-16 flex flex-col items-center gap-5 text-center">
          {/* Los dos logos sobre una tarjeta blanca: ninguno de los dos
              tiene version en blanco y sobre el degradado se pierden. */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 bg-white rounded-2xl px-5 py-3">
            {campania.instituciones.map((inst) => (
              <Image
                key={inst.logo}
                src={inst.logo}
                alt={inst.nombre}
                width={Math.round((56 * inst.ancho) / inst.alto)}
                height={56}
                priority
                className="h-10 sm:h-14 w-auto"
              />
            ))}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight text-balance">
            {campania.titulo}
          </h1>
          <p
            className="text-lg sm:text-2xl font-extrabold"
            style={{ color: campania.paleta.acento }}
          >
            {campania.bajada}
          </p>

          <p className="bg-white/15 rounded-2xl px-5 py-3 text-base sm:text-xl font-extrabold text-balance">
            {formatArs(campania.precioArs)} por número · {campania.premio}
          </p>

          <ContadorBonos
            vendidos={vendido.bonos}
            total={campania.totalNumeros}
            recaudado={vendido.monto}
            acento={campania.paleta.acento}
            sobreColor
          />

          {abierta ? (
            <Link
              href={rutaDeCompra(campania)}
              style={{
                background: campania.paleta.acento,
                color: campania.paleta.acentoTexto,
              }}
              className="mt-1 rounded-full px-10 py-4 text-xl font-extrabold shadow-lg hover:brightness-95 transition"
            >
              Comprar mi número
            </Link>
          ) : (
            <p className="mt-1 rounded-full bg-white/20 px-8 py-3 text-lg font-bold">
              La venta abre en los próximos días
            </p>
          )}

          {campania.sorteo && (
            <p className="text-sm sm:text-base opacity-90">{campania.sorteo}</p>
          )}
        </div>
      </section>

      <section className="max-w-3xl w-full mx-auto px-4 py-10 sm:py-14 flex flex-col gap-8">
        <div className="flex flex-col gap-4 text-base sm:text-lg leading-relaxed text-pretty">
          {PARRAFOS.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          <p className="font-extrabold text-rotary-azure-dark text-lg sm:text-xl text-balance">
            {CIERRE_TEXTO}
          </p>
          <p className="font-semibold">
            ¡Sumate, participá y ayudanos a seguir transformando realidades!
          </p>
        </div>

        <dl className="grid gap-3 sm:grid-cols-3">
          {[
            ["El premio", campania.premio],
            ["Los números", `${campania.totalNumeros.toLocaleString("es-AR")}, del ${rangoDe(campania)}`],
            ["Cada número", formatArs(campania.precioArs)],
          ].map(([titulo, valor]) => (
            <div key={titulo} className="bg-white rounded-2xl px-4 py-3 shadow-sm">
              <dt className="text-xs uppercase tracking-wide text-foreground/60">{titulo}</dt>
              <dd className="font-semibold leading-snug">{valor}</dd>
            </div>
          ))}
        </dl>

        {/* Los datos de la cuenta no van acá: van en el paso del pago, con
            el monto exacto al lado y los botones para copiar alias y CBU.
            En la portada de la campaña son cinco renglones de números que
            nadie va a usar todavía, justo donde tiene que estar el botón
            de comprar. */}
        <p className="text-sm text-foreground/70">
          El bono se paga por transferencia a la cuenta del Rotary Club de
          Neuquén. Los datos para transferir y el lugar para subir el
          comprobante aparecen al final de la compra.
        </p>

        <Link href="/" className="text-rotary-azure font-semibold hover:underline">
          ‹ Ver todas las campañas
        </Link>
      </section>
    </main>
  );
}
