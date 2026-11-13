"use client";

import { usePathname } from "next/navigation";
import { LogoInstitucion } from "@/components/LogoInstitucion";
import { CAMPANIAS, campaniaDeRuta, POLIOPLUS } from "@/lib/campanias";

/*
 * La barra con el logo, para las pantallas de fondo blanco.
 *
 * La portada y la home de cada campaña ya traen su propia marca adentro
 * del hero de color, y cada una la suya. Poner ademas esta barra arriba
 * duplicaria el logo.
 *
 * En el resto —los tres pasos de la compra— la barra es lo unico que
 * dice de que campaña es la pantalla, asi que tiene que ser la marca de
 * esa campaña. Antes habia una sola barra, la del distrito, y el que
 * compraba la camiseta elegia su numero y cargaba sus datos abajo del
 * logo de End Polio.
 */
const SIN_BARRA = new Set(["/", ...CAMPANIAS.map((c) => c.ruta)]);

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname && SIN_BARRA.has(pathname)) return null;
  /*
   * La pantalla de una orden tambien pone su propia barra. De que campaña
   * es esa orden no se sabe por la ruta —el numero de orden no lo dice—,
   * lo sabe la pagina, que lo consulta en la base: asi que la dibuja ella
   * y no esta barra, que si no mostraria la marca de la otra campaña.
   */
  if (pathname?.startsWith("/orden/")) return null;

  // /comprar/<slug>/... es de su campaña; el panel y las demas pantallas
  // no son de ninguna y siguen con el lockup del distrito.
  const campania = campaniaDeRuta(pathname);
  const instituciones = (campania ?? POLIOPLUS).instituciones;
  // Un logo solo entra grande; dos tienen que achicarse para entrar al
  // lado en un celular angosto.
  const unaSola = instituciones.length === 1;

  return (
    <header className="bg-white py-4 px-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-b border-rotary-ink/5">
      {instituciones.map((inst) => (
        <LogoInstitucion
          key={inst.logo}
          institucion={inst}
          alto={unaSola ? 3 : 2}
          altoSm={unaSola ? 4 : 3}
          priority
        />
      ))}
    </header>
  );
}
