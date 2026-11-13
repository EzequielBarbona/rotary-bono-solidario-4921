import Image from "next/image";
import type { Campania } from "@/lib/campanias";

/*
 * La barra blanca con los logos de una campaña.
 *
 * La usa la pantalla de la orden, que es la unica que sabe de que campaña
 * se trata —se lo pregunta a la base por el numero de orden— y por eso no
 * puede resolverlo SiteHeader, que solo ve la ruta.
 */
export function BarraDeCampania({ campania }: { campania: Campania }) {
  const alto = campania.instituciones.length > 1 ? "h-8 sm:h-12" : "h-12 sm:h-16";

  return (
    <header className="bg-white py-4 px-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-b border-rotary-ink/5">
      {campania.instituciones.map((inst) => (
        // El width que se le pasa es el de dibujo y no el del archivo: en
        // un flex, Next usa el ancho intrinseco como base y los dos logos
        // se apilan aunque entren de sobra al lado.
        <Image
          key={inst.logo}
          src={inst.logo}
          alt={inst.nombre}
          width={Math.round((40 * inst.ancho) / inst.alto)}
          height={40}
          priority
          className={`${alto} w-auto`}
        />
      ))}
    </header>
  );
}
