import Image from "next/image";
import type { CSSProperties } from "react";
import type { Institucion } from "@/lib/campanias";

/*
 * El logo de una institución, dibujado siempre igual.
 *
 * Vive en un solo lugar porque hay dos cosas fáciles de olvidar cuando se
 * repite a mano en cada pantalla:
 *
 * - El `width` que recibe Next es la base del flex, no el tamaño final.
 *   Si se calcula con el alto de escritorio, en un celular dos logos no
 *   entran al lado y se apilan aunque en pantalla midan la mitad. Por eso
 *   se calcula siempre con el alto más chico, el del celular.
 * - Cada marca necesita su propio ajuste de tamaño para que dos logos se
 *   vean parejos (ver `escala` en lib/campanias.ts).
 *
 * El alto va en una variable CSS y no en una clase de Tailwind porque
 * depende de la escala de cada institución, que es un número y no una
 * clase que se pueda escribir de antemano.
 */

/* La página usa html{font-size:120%}: 1rem son 19,2 px reales. */
const PX_POR_REM = 19.2;

export function LogoInstitucion({
  institucion,
  alto,
  altoSm,
  priority,
}: {
  institucion: Institucion;
  /** Alto en rem en pantalla chica. */
  alto: number;
  /** Alto en rem de sm: para arriba. */
  altoSm: number;
  priority?: boolean;
}) {
  const escala = institucion.escala ?? 1;
  // Redondeado: sin esto, 3.5 * 0.8 sale "2.8000000000000003rem" en el
  // HTML. Se dibuja igual, pero no hace falta mandar eso por la red.
  const rem = (base: number) => Math.round(base * escala * 1000) / 1000;
  const remChico = rem(alto);
  const remGrande = rem(altoSm);
  const pxChico = Math.round(remChico * PX_POR_REM);

  return (
    <Image
      src={institucion.logo}
      alt={institucion.nombre}
      width={Math.round((pxChico * institucion.ancho) / institucion.alto)}
      height={pxChico}
      priority={priority}
      style={
        {
          "--logo-alto": `${remChico}rem`,
          "--logo-alto-sm": `${remGrande}rem`,
        } as CSSProperties
      }
      className="h-[var(--logo-alto)] sm:h-[var(--logo-alto-sm)] w-auto"
    />
  );
}
