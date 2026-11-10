import Image from "next/image";
import Link from "next/link";
import { ventasDe, type Vendido } from "@/lib/ventas-campania";
import { formatArs } from "@/lib/format";
import { formatArtDayTime } from "@/lib/dates";
import {
  CAMPANIAS,
  ETIQUETA_ESTADO,
  estadoDe,
  rangoDe,
  type Campania,
  type EstadoCampania,
} from "@/lib/campanias";

/*
 * La portada: todas las campañas de bonos del sitio, abiertas y cerradas.
 *
 * Hasta la campaña del PolioPlus la raiz era la campaña misma. Ahora es
 * el lugar donde alguien que llega con un link viejo, o que escucho
 * hablar de "los bonos de Rotary", encuentra cual es cual.
 */

// Los contadores salen de la base en cada visita, igual que en la home de
// cada campaña: una portada que anuncia numeros viejos es peor que una
// sin numeros.
export const dynamic = "force-dynamic";

/*
 * El titulo y la bajada tambien van en openGraph: sin eso, la tarjeta que
 * arma WhatsApp hereda los del layout raiz, que son los del PolioPlus, y
 * el link del sitio sale anunciando una campaña que ya cerro.
 */
const TITULO = "Bonos solidarios de Rotary";
const BAJADA =
  "Las campañas de bonos solidarios de Rotary: cuál está abierta, cuál ya cerró y a dónde va lo que se recauda.";

export const metadata = {
  title: TITULO,
  description: BAJADA,
  openGraph: {
    type: "website" as const,
    locale: "es_AR",
    url: "/",
    siteName: TITULO,
    title: TITULO,
    description: BAJADA,
  },
  twitter: { card: "summary_large_image" as const, title: TITULO, description: BAJADA },
};

async function ventasPorCampania() {
  const pares = await Promise.all(
    CAMPANIAS.map(async (c) => [c.slug, await ventasDe(c.slug)] as const)
  );
  return new Map(pares);
}

/** Alto al que se dibujan los logos en la tarjeta, en px (el sm: del CSS). */
const ALTO_LOGO = 44;

const ESTILO_ETIQUETA: Record<EstadoCampania, string> = {
  abierta: "bg-emerald-500 text-white",
  proxima: "bg-white/25 text-white",
  cerrada: "bg-white/20 text-white/90",
};

function Etiqueta({ estado }: { estado: EstadoCampania }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs sm:text-sm font-bold uppercase tracking-wide ${ESTILO_ETIQUETA[estado]}`}
    >
      {/* El punto late solo en la que se puede comprar ahora. */}
      <span
        aria-hidden
        className={`w-2 h-2 rounded-full ${
          estado === "abierta" ? "bg-white animate-pulse" : "bg-white/70"
        }`}
      />
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

function TarjetaCampania({
  campania,
  vendido,
}: {
  campania: Campania;
  vendido: Vendido | undefined;
}) {
  const estado = estadoDe(campania);
  const abierta = estado === "abierta";
  const proxima = estado === "proxima";
  const porcentaje = vendido
    ? Math.min(100, Math.round((vendido.bonos / campania.totalNumeros) * 100))
    : 0;

  const contenido = (
    <article
      style={{ background: campania.paleta.fondo, color: campania.paleta.texto }}
      className={`relative overflow-hidden rounded-3xl h-full p-6 sm:p-8 flex flex-col gap-5 shadow-lg transition ${
        proxima ? "" : "group-hover:shadow-2xl group-hover:-translate-y-1"
      }`}
    >
      {/* Las mismas ruedas que la home de la campaña, de marca de agua. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 w-64 h-64 rounded-full border-[20px] border-white/10"
      />

      <div className="relative flex items-start justify-between gap-3">
        <Etiqueta estado={estado} />
        {!proxima && (
          <span className="text-xs sm:text-sm font-semibold opacity-80 whitespace-nowrap">
            {abierta ? "Comprar ›" : "Ver la campaña ›"}
          </span>
        )}
      </div>

      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-3 bg-white rounded-2xl px-4 py-3">
        {campania.instituciones.map((inst) => (
          // El width que se le pasa es el de dibujo, no el del archivo: en
          // un flex, Next usa el ancho intrinseco (640 px) como base y los
          // dos logos se apilan aunque entren de sobra al lado.
          <Image
            key={inst.logo}
            src={inst.logo}
            alt={inst.nombre}
            width={Math.round((ALTO_LOGO * inst.ancho) / inst.alto)}
            height={ALTO_LOGO}
            className="h-8 sm:h-11 w-auto"
          />
        ))}
      </div>

      <div className="relative flex flex-col gap-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-balance">
          {campania.titulo}
        </h2>
        <p className="text-sm sm:text-base opacity-90 text-pretty">{campania.bajada}</p>
      </div>

      <dl className="relative grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white/15 rounded-xl px-3 py-2">
          <dt className="opacity-80 text-xs uppercase tracking-wide">Premio</dt>
          <dd className="font-semibold leading-snug">{campania.premio}</dd>
        </div>
        <div className="bg-white/15 rounded-xl px-3 py-2">
          <dt className="opacity-80 text-xs uppercase tracking-wide">Números</dt>
          <dd className="font-semibold leading-snug">
            {campania.totalNumeros.toLocaleString("es-AR")}, del {rangoDe(campania)}
          </dd>
        </div>
      </dl>

      <div className="relative mt-auto flex flex-col gap-3">
        {/* Lo vendido solo donde hubo venta: una barra en cero no informa. */}
        {vendido && vendido.bonos > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold">
                {vendido.bonos.toLocaleString("es-AR")} de{" "}
                {campania.totalNumeros.toLocaleString("es-AR")} bonos
              </span>
              <span className="opacity-90">{formatArs(vendido.monto)}</span>
            </div>
            <div className="h-2 rounded-full bg-white/25 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${porcentaje}%`, background: campania.paleta.acento }}
              />
            </div>
          </div>
        )}

        <p className="text-sm opacity-90">
          {campania.sorteo ??
            (campania.cierreAt
              ? `La venta cierra el ${formatArtDayTime(new Date(campania.cierreAt))}`
              : "Fecha de sorteo a confirmar")}
        </p>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span
            style={{ background: campania.paleta.acento, color: campania.paleta.acentoTexto }}
            className="rounded-full px-4 py-2 font-extrabold text-lg"
          >
            {formatArs(campania.precioArs)}
            <span className="font-semibold text-sm"> por número</span>
          </span>
          {proxima && (
            <span className="text-sm font-semibold opacity-90">
              Abre la venta en los próximos días
            </span>
          )}
        </div>
      </div>
    </article>
  );

  // Una campaña sin publicar se anuncia pero no se puede abrir: no hay
  // pagina que mostrar todavia.
  if (proxima) return <div className="h-full">{contenido}</div>;

  return (
    <Link href={campania.ruta} className="group block h-full">
      {contenido}
    </Link>
  );
}

export default async function Portada() {
  const ventas = await ventasPorCampania();
  const campanias = [...CAMPANIAS].sort((a, b) => {
    // Primero lo que se puede comprar, despues lo que viene, al final lo
    // que ya cerro.
    const orden: Record<EstadoCampania, number> = { abierta: 0, proxima: 1, cerrada: 2 };
    return orden[estadoDe(a)] - orden[estadoDe(b)];
  });

  return (
    <main className="flex-1 flex flex-col">
      <section className="bg-gradient-to-br from-rotary-azure to-rotary-azure-dark text-white">
        <div className="max-w-5xl w-full mx-auto px-4 py-10 sm:py-14 flex flex-col items-center gap-3 text-center">
          <span className="uppercase tracking-widest text-[0.7rem] sm:text-sm font-semibold text-rotary-gold">
            Rotary · Bonos solidarios
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight text-balance">
            Cada número ayuda a alguien
          </h1>
          <p className="max-w-2xl text-base sm:text-lg opacity-90 text-pretty">
            Estas son las campañas de bonos de Rotary y de las instituciones que
            trabajan con nosotros. Elegí la que quieras acompañar.
          </p>
        </div>
      </section>

      <section className="max-w-5xl w-full mx-auto px-4 py-8 sm:py-12">
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 items-stretch">
          {campanias.map((campania) => (
            <TarjetaCampania
              key={campania.slug}
              campania={campania}
              vendido={ventas.get(campania.slug)}
            />
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-foreground/70 text-pretty">
          ¿Compraste un bono y querés ver tu orden? Usá el link que te quedó al
          terminar la compra o escribile al club que te lo vendió.
        </p>
      </section>
    </main>
  );
}
