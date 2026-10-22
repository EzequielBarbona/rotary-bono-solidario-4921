import type { Metadata } from "next";
import Link from "next/link";
import { raffleConfig } from "@/lib/config";
import { datosDeVariante, esVariante } from "./variantes";

/*
 * Una página por variante, solo para mirar cómo le queda la vista previa
 * a WhatsApp. No se enlaza desde ningún lado y no se indexa.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ v: string }>;
}): Promise<Metadata> {
  const { v } = await params;
  if (!esVariante(v)) return { robots: { index: false, follow: false } };

  const { ancho, alto, nota, sinDescripcion } = datosDeVariante(v);
  const descripcion = sinDescripcion
    ? undefined
    : "Lo recaudado va al programa PolioPlus de Rotary International.";
  return {
    metadataBase: new URL(raffleConfig.siteUrl),
    title: raffleConfig.title,
    description: descripcion,
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "es_AR",
      siteName: "Bono Solidario PolioPlus",
      title: raffleConfig.title,
      description: descripcion,
      url: `/pv/${v}`,
      images: [
        {
          url: `/pv/${v}/tarjeta.png`,
          width: ancho,
          height: alto,
          type: "image/png",
          alt: nota,
        },
      ],
    },
  };
}

export default async function PruebaVistaPrevia({
  params,
}: {
  params: Promise<{ v: string }>;
}) {
  const { v } = await params;
  const nota = esVariante(v) ? datosDeVariante(v).nota : "variante inexistente";

  return (
    <main className="flex-1 max-w-lg w-full mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
      <p className="uppercase tracking-widest text-xs font-bold text-rotary-azure">
        Prueba de vista previa
      </p>
      <h1 className="text-2xl font-extrabold text-rotary-ink">{nota}</h1>
      <p className="text-sm text-rotary-ink/60">
        Esta página existe solo para ver cómo arma WhatsApp la tarjeta del link.
      </p>
      <Link href="/" className="text-rotary-azure font-semibold hover:underline">
        Ir al bono
      </Link>
    </main>
  );
}
