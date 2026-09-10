import { formatDrawDate } from "@/lib/format";
import type { Proyeccion } from "@/lib/proyeccion";

/** "1,4" y no "1.4285714": el subcomite necesita una cifra, no precision falsa. */
function ritmo(bonosPorDia: number) {
  return bonosPorDia.toLocaleString("es-AR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/**
 * Cuantos bonos habria vendidos el dia del sorteo si el ritmo no cambia.
 *
 * Es un tablero, no un parrafo: la fecha del sorteo esta fija y lo unico
 * que se decide mirandolo es si hay que apretar la difusion esta semana.
 * Por eso el numero proyectado va grande y solo, y el resto son cifras
 * sueltas debajo.
 */
export function ProyeccionVentas({
  proyeccion,
  totalBonos,
  drawDate,
}: {
  proyeccion: Proyeccion | null;
  totalBonos: number;
  drawDate: string;
}) {
  if (!proyeccion) {
    return (
      <div className="border border-rotary-ink/10 rounded-lg px-4 py-3">
        <h2 className="text-sm font-bold text-rotary-ink">Proyección</h2>
        <p className="mt-1 text-sm text-rotary-ink/60">
          Todavía no hay ventas para proyectar nada.
        </p>
      </div>
    );
  }

  const {
    vendidos,
    ritmoUsado,
    ritmoHistorico,
    usaHistorico,
    diasHastaSorteo,
    proyectadoAlSorteo,
    faltanteAlSorteo,
    ritmoNecesario,
    completo,
  } = proyeccion;

  // Verde solo si al ritmo de hoy se llega a la meta el dia del sorteo.
  // Sin fecha de sorteo no hay contra qué comparar, así que queda neutro.
  const alcanza = faltanteAlSorteo === null ? null : faltanteAlSorteo === 0;

  return (
    <div
      className={`border rounded-lg px-4 py-4 flex flex-col gap-4 ${
        alcanza === null
          ? "border-rotary-ink/10"
          : alcanza
            ? "border-rotary-teal/40 bg-rotary-teal/5"
            : "border-rotary-gold/50 bg-rotary-gold/10"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-bold text-rotary-ink">
          Proyección al {formatDrawDate(drawDate)}
        </h2>
        {alcanza !== null && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              alcanza
                ? "bg-rotary-teal text-white"
                : "bg-rotary-gold text-rotary-ink"
            }`}
          >
            {alcanza ? `Llegan los ${totalBonos}` : `Faltarían ${faltanteAlSorteo}`}
          </span>
        )}
      </div>

      {completo ? (
        <p className="text-2xl font-extrabold text-rotary-ink">
          {totalBonos} de {totalBonos} &mdash; ya están todos vendidos.
        </p>
      ) : proyectadoAlSorteo === null ? (
        <p className="text-sm text-rotary-ink/60">
          Sin fecha de sorteo cargada no se puede proyectar.
        </p>
      ) : (
        <div className="flex items-end gap-3 flex-wrap">
          <span className="text-6xl font-extrabold leading-none tabular-nums text-rotary-ink">
            {proyectadoAlSorteo}
          </span>
          {/* Que ritmo se uso va en la oracion y no solo en la cifra de
              abajo: son dos ritmos distintos en pantalla y sin decirlo
              no se sabe cual de los dos multiplico este numero. */}
          <span className="text-base text-rotary-ink/60 pb-1">
            de {totalBonos} bonos si se mantiene el ritmo{" "}
            {usaHistorico
              ? "promedio desde la primera venta"
              : "de los últimos 7 días"}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <Cifra valor={vendidos} etiqueta="vendidos hoy" />
        <Cifra
          valor={ritmo(ritmoUsado)}
          etiqueta={usaHistorico ? "por día, promedio" : "por día, últimos 7"}
        />
        {ritmoNecesario !== null && (
          <Cifra
            valor={ritmo(ritmoNecesario)}
            etiqueta="por día para llegar"
            destacado={ritmoUsado < ritmoNecesario}
          />
        )}
        {diasHastaSorteo !== null && (
          <Cifra valor={diasHastaSorteo} etiqueta="días al sorteo" />
        )}
      </div>

      <p className="text-xs text-rotary-ink/50">
        {usaHistorico
          ? `Proyecta con el promedio desde la primera venta (${ritmo(
              ritmoHistorico
            )} por día) porque en los últimos 7 días no hubo ventas.`
          : `Promedio desde la primera venta: ${ritmo(ritmoHistorico)} por día.`}{" "}
        Cuenta reservas además de pagos confirmados.
      </p>
    </div>
  );
}

function Cifra({
  valor,
  etiqueta,
  destacado,
}: {
  valor: string | number;
  etiqueta: string;
  destacado?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span
        className={`text-2xl font-extrabold leading-none tabular-nums ${
          destacado ? "text-rotary-gold-dark" : "text-rotary-ink"
        }`}
      >
        {valor}
      </span>
      <span className="text-xs text-rotary-ink/60 mt-1">{etiqueta}</span>
    </div>
  );
}
