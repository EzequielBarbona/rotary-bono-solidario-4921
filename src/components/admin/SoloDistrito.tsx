import Link from "next/link";

/*
 * El cartel de una seccion que no es de la campaña con la que se entro.
 *
 * El padron de socios, el ranking entre clubes y la difusion son del
 * distrito: quien administra una campaña puntual no los ve. La barra de
 * arriba ya no le ofrece esos links, pero la URL se puede escribir a
 * mano, y entonces tiene que encontrar esto y no los datos.
 */
export function SoloDistrito() {
  return (
    <main className="flex-1 max-w-lg w-full mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
      <h1 className="text-2xl font-extrabold text-rotary-ink">
        Esta sección es del distrito
      </h1>
      <p className="text-base text-rotary-ink/70">
        El padrón de clubes y la difusión no son de una campaña: se
        administran con la clave del distrito.
      </p>
      <Link
        href="/admin"
        className="mt-2 bg-rotary-azure text-white font-bold px-8 py-3 rounded-full hover:bg-rotary-azure-dark transition-colors"
      >
        Volver a mis órdenes
      </Link>
    </main>
  );
}
