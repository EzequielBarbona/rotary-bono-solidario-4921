import Image from "next/image";
import Link from "next/link";
import { LogoInstitucion } from "@/components/LogoInstitucion";
import { notFound } from "next/navigation";
import { ContadorBonos } from "@/components/ContadorBonos";
import { CuentaRegresiva } from "@/components/CuentaRegresiva";
import { campaniaDeSlug, estadoDe, rangoDe, rutaDeCompra } from "@/lib/campanias";
import { ventasDe } from "@/lib/ventas-campania";
import { cierreDe } from "@/lib/cierre";
import { formatArtDayTime } from "@/lib/dates";
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
  "Bono solidario de Rotary Club de Neuquén y la Asociación Moiru. Sorteamos una camiseta del Club Cipolletti talle S, firmada por los jugadores.";

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
  "En esta oportunidad, ponemos a disposición una camiseta del Club Cipolletti talle S, firmada por los jugadores, un premio que representa también el espíritu de encuentro, identidad y compromiso con nuestra región.",
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

  /*
   * El cierre, para la cuenta regresiva. Se resuelve acá y no en el
   * navegador porque el instante y su versión en palabras tienen que
   * salir del servidor: si cada uno los armara por su lado, el primer
   * dibujo no coincidiría y React reharía la página entera.
   */
  const cierre = cierreDe(campania);
  const cuenta = cierre
    ? {
        cierraEn: cierre.getTime(),
        /*
         * La página es force-dynamic: se dibuja de nuevo en cada visita,
         * así que leer el reloj del servidor es justamente lo que hace
         * falta. La regla apunta a los componentes del navegador.
         */
        // eslint-disable-next-line react-hooks/purity
        restante: cierre.getTime() - Date.now(),
        texto: formatArtDayTime(cierre),
      }
    : null;

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
          <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-5 gap-y-3 bg-white rounded-2xl px-4 sm:px-5 py-3">
            {campania.instituciones.map((inst) => (
              <LogoInstitucion
                key={inst.logo}
                institucion={inst}
                alto={2}
                altoSm={3.5}
                priority
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
            {campania.premioDetalle && (
              // El talle va en el mismo recuadro pero mas chico: es un
              // dato que importa y no tiene que competir con el premio.
              <span className="block font-semibold text-sm sm:text-base opacity-90">
                {campania.premioDetalle}
              </span>
            )}
          </p>

          {/* Lejos del cierre es un renglón al pie del precio; adentro de
              las últimas 48 horas se convierte en el reloj grande, acá
              arriba, que es cuando el apuro es real. */}
          {abierta && cuenta && (
            <CuentaRegresiva
              cierraEn={cuenta.cierraEn}
              restanteInicial={cuenta.restante}
              textoCierre={cuenta.texto}
              titulo="Últimas horas para comprar"
            />
          )}

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

      {/* El premio, apenas se termina el hero: un bono se vende mostrando
          lo que se sortea, y la camiseta firmada se explica sola. */}
      {campania.fotos && campania.fotos.length > 0 && (
        <section className="max-w-3xl w-full mx-auto px-4 pt-8 sm:pt-12 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {campania.fotos.map((foto) => (
              <figure
                key={foto.src}
                className="bg-white rounded-2xl p-3 shadow-sm overflow-hidden"
              >
                <Image
                  src={foto.src}
                  alt={foto.alt}
                  width={foto.ancho}
                  height={foto.alto}
                  className="w-full h-auto rounded-xl"
                  sizes="(min-width: 640px) 440px, 92vw"
                />
              </figure>
            ))}
          </div>
          <p className="text-center text-base sm:text-lg font-semibold text-rotary-azure-dark text-balance">
            Gracias a los jugadores del Club Cipolletti, que firmaron esta
            camiseta para acompañar la campaña.
          </p>
        </section>
      )}

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
            [
              "El premio",
              [campania.premio, campania.premioDetalle].filter(Boolean).join(" · "),
            ],
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
