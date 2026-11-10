import { formatArs } from "@/lib/format";

/*
 * Cuantos bonos se vendieron, en grande.
 *
 * Reemplaza al contador de chicos vacunados del PolioPlus. Alla la cuenta
 * convertia pesos en vacunas, que es una equivalencia real y publicada
 * por Rotary; aca no hay nada parecido que convertir, asi que lo que
 * mueve es lo que queda: "faltan 336 numeros" apura mas que cualquier
 * cifra inventada.
 */

export function ContadorBonos({
  vendidos,
  total,
  recaudado,
  acento,
  /** Sobre fondo de color (la home de la campaña) o sobre el fondo claro. */
  sobreColor = false,
}: {
  vendidos: number;
  total: number;
  recaudado?: number;
  acento: string;
  sobreColor?: boolean;
}) {
  const quedan = Math.max(0, total - vendidos);
  const porcentaje = total > 0 ? Math.min(100, (vendidos / total) * 100) : 0;
  const agotado = quedan === 0;

  const tenue = sobreColor ? "text-white/80" : "text-foreground/70";
  const riel = sobreColor ? "bg-white/25" : "bg-black/10";

  return (
    <div className="w-full max-w-xl flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <p className="flex items-baseline gap-2">
          <span
            className="text-5xl sm:text-6xl font-extrabold leading-none tabular-nums"
            style={{ color: acento }}
          >
            {vendidos.toLocaleString("es-AR")}
          </span>
          <span className={`text-lg sm:text-xl font-semibold ${tenue}`}>
            de {total.toLocaleString("es-AR")} bonos
          </span>
        </p>
        {recaudado !== undefined && recaudado > 0 && (
          <p className={`text-base sm:text-lg font-semibold ${tenue}`}>
            {formatArs(recaudado)}
          </p>
        )}
      </div>

      <div
        className={`h-3 rounded-full overflow-hidden ${riel}`}
        role="progressbar"
        aria-valuenow={vendidos}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${vendidos} de ${total} bonos vendidos`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${porcentaje}%`, background: acento }}
        />
      </div>

      <p className={`text-base sm:text-lg font-semibold ${sobreColor ? "text-white" : ""}`}>
        {agotado
          ? "No quedan números: se vendieron todos."
          : vendidos === 0
            ? `Todavía están los ${total.toLocaleString("es-AR")} números disponibles.`
            : // En singular cuando queda uno: "Queda 1 número" y no "Quedan 1".
              `${quedan === 1 ? "Queda" : "Quedan"} ${quedan.toLocaleString("es-AR")} ${
                quedan === 1 ? "número" : "números"
              } sin vender.`}
      </p>
    </div>
  );
}
