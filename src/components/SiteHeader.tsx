"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { CAMPANIAS } from "@/lib/campanias";

/*
 * La barra con el logo, para las pantallas de fondo blanco.
 *
 * La portada y la home de cada campaña ya traen su propia marca adentro
 * del hero de color, y cada una la suya: el PolioPlus el lockup del
 * distrito, la camiseta los logos de Rotary Neuquen y Moiru. Poner
 * ademas esta barra arriba duplicaria el logo en una, y mostraria el de
 * la campaña equivocada en la otra.
 */
const SIN_BARRA = new Set(["/", ...CAMPANIAS.map((c) => c.ruta)]);

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname && SIN_BARRA.has(pathname)) return null;

  return (
    <header className="bg-white py-4 px-4 flex items-center justify-center border-b border-rotary-ink/5">
      <Image
        src="/brand/rotary-endpolio-lockup-color.png"
        alt="Rotary Distrito 4921 - End Polio Now"
        width={340}
        height={152}
        priority
        className="h-12 sm:h-16 w-auto"
      />
    </header>
  );
}
