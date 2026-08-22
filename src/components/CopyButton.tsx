"use client";

import { useEffect, useState } from "react";

/**
 * Copia un dato al portapapeles. Existe para que nadie tenga que tipear
 * a mano el CVU ni el alias: ahi es donde la gente se equivoca un digito
 * o directamente abandona la transferencia.
 */
export function CopyButton({
  value,
  label,
  texto = "Copiar",
}: {
  /** Lo que se copia, que no siempre es lo que se ve (el monto se copia sin el "$"). */
  value: string;
  /** Para el lector de pantalla: "Copiar alias", "Copiar CVU". */
  label: string;
  /** Texto del botón, cuando "Copiar" a secas no alcanza para saber qué copia. */
  texto?: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const [falloCopia, setFalloCopia] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const timeout = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(timeout);
  }, [copiado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(value);
      setCopiado(true);
      setFalloCopia(false);
    } catch {
      // Navegadores viejos o contextos sin permiso de portapapeles: al
      // menos dejamos el texto seleccionado para copiar a mano.
      setFalloCopia(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copiar}
        aria-label={label}
        className="ml-2 align-middle text-xs font-semibold text-rotary-azure border border-rotary-azure/40 rounded-full px-2 py-0.5 hover:bg-rotary-azure/10 transition-colors"
      >
        {copiado ? "¡Copiado!" : texto}
      </button>
      {falloCopia && (
        <span className="ml-2 text-xs text-amber-700">
          No se pudo copiar, seleccionalo a mano.
        </span>
      )}
    </>
  );
}
