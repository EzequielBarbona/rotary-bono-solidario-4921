import { LogoInstitucion } from "@/components/LogoInstitucion";
import type { Campania } from "@/lib/campanias";

/*
 * La barra blanca con los logos de una campaña.
 *
 * La usa la pantalla de la orden, que es la unica que sabe de que campaña
 * se trata —se lo pregunta a la base por el numero de orden— y por eso no
 * puede resolverlo SiteHeader, que solo ve la ruta.
 */
export function BarraDeCampania({ campania }: { campania: Campania }) {
  // Un logo solo entra grande; dos tienen que achicarse para entrar al
  // lado en un celular angosto.
  const unaSola = campania.instituciones.length === 1;

  return (
    <header className="bg-white py-4 px-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-b border-rotary-ink/5">
      {campania.instituciones.map((inst) => (
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
