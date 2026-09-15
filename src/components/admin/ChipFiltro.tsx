"use client";

/**
 * Un filtro que se prende y se apaga, con cuántos elementos lo cumplen.
 *
 * La cantidad va a la vista a propósito: antes de tocar nada ya se sabe
 * que hay 6 órdenes pagadas sin avisar o 40 clubes sin ventas, y eso
 * muchas veces es la respuesta que se buscaba.
 */
export function ChipFiltro({
  activo,
  onClick,
  texto,
  cantidad,
  alerta = false,
}: {
  activo: boolean;
  onClick: () => void;
  texto: string;
  cantidad: number;
  /** Resalta el filtro cuando hay casos: son pendientes de trabajo, no datos. */
  alerta?: boolean;
}) {
  // Un filtro vacío solo mostraría una lista vacía: se apaga, salvo que
  // ya esté prendido, para poder soltarlo.
  const vacio = cantidad === 0 && !activo;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      disabled={vacio}
      className={`inline-flex items-center gap-1.5 text-sm rounded-full border px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        activo
          ? "border-rotary-azure bg-rotary-azure text-white"
          : alerta && cantidad > 0
            ? "border-rotary-gold/60 bg-rotary-gold/10 text-rotary-ink hover:bg-rotary-gold/20"
            : "border-rotary-ink/15 text-rotary-ink/80 hover:bg-rotary-ink/5"
      }`}
    >
      {texto}
      <span
        className={`text-xs font-bold tabular-nums rounded-full px-1.5 py-px ${
          activo ? "bg-white/25" : "bg-rotary-ink/10"
        }`}
      >
        {cantidad}
      </span>
    </button>
  );
}
