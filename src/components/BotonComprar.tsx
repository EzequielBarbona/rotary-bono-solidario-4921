import Link from "next/link";
import { ventaCerrada } from "@/lib/cierre";

/*
 * El boton de comprar, que despues del cierre deja de serlo.
 *
 * Pasada la hora no alcanza con sacarlo: si simplemente desapareciera,
 * quien entra no sabe si llego tarde o si la pagina esta rota. En su
 * lugar queda el cartel diciendo que la venta cerro.
 */

const ESTILOS = {
  sobreAzul: {
    abierto:
      "bg-rotary-gold text-rotary-ink hover:bg-rotary-gold-dark transition-colors",
    cerrado: "bg-white/15 text-white/90",
  },
  sobreBlanco: {
    abierto:
      "bg-rotary-azure text-white hover:bg-rotary-azure-dark transition-colors",
    cerrado: "bg-rotary-ink/10 text-rotary-ink/70",
  },
} as const;

export function BotonComprar({
  tono,
  className = "",
}: {
  tono: keyof typeof ESTILOS;
  className?: string;
}) {
  const base = `font-bold text-lg px-8 sm:px-10 py-4 rounded-full whitespace-nowrap ${className}`;
  const estilo = ESTILOS[tono];

  if (ventaCerrada()) {
    return <span className={`${base} ${estilo.cerrado}`}>La venta cerró</span>;
  }

  return (
    <Link href="/comprar/cantidad" className={`${base} ${estilo.abierto}`}>
      Comprar bono solidario
    </Link>
  );
}
