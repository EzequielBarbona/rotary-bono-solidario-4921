import { formatArtDate } from "@/lib/dates";
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
 * Contesta las dos preguntas que se hace el subcomite mirando el tablero:
 * a este ritmo cuando terminamos, y a que ritmo habria que ir para llegar
 * al sorteo con los 1000 vendidos.
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
    restantes,
    ritmoUsado,
    ritmoReciente,
    ritmoHistorico,
    usaHistorico,
    fechaEstimada,
    diasHastaSorteo,
    ritmoNecesario,
    llegaTarde,
    completo,
  } = proyeccion;

  // Verde solo si el ritmo actual alcanza para llegar al sorteo. Sin fecha
  // de sorteo no hay contra qué comparar, así que queda neutro.
  const vaBien =
    ritmoNecesario === null ? null : ritmoUsado >= ritmoNecesario;

  return (
    <div
      className={`border rounded-lg px-4 py-4 flex flex-col gap-3 ${
        vaBien === null
          ? "border-rotary-ink/10"
          : vaBien
            ? "border-rotary-teal/40 bg-rotary-teal/5"
            : "border-rotary-gold/50 bg-rotary-gold/10"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-bold text-rotary-ink">Proyección</h2>
        {vaBien !== null && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              vaBien
                ? "bg-rotary-teal text-white"
                : "bg-rotary-gold text-rotary-ink"
            }`}
          >
            {vaBien ? "Al ritmo necesario" : "Por debajo del ritmo necesario"}
          </span>
        )}
      </div>

      <p className="text-base text-rotary-ink">
        Van <span className="font-extrabold">{vendidos}</span> de {totalBonos}{" "}
        bonos.{" "}
        {completo ? (
          <span className="font-bold">Ya están todos vendidos.</span>
        ) : (
          <>
            Faltan <span className="font-extrabold">{restantes}</span>.
          </>
        )}
      </p>

      {!completo && (
        <>
          {/* Pregunta 1: a este ritmo, ¿qué día terminamos? */}
          <p className="text-base text-rotary-ink">
            {fechaEstimada ? (
              <>
                Si se sigue vendiendo a{" "}
                <span className="font-bold">{ritmo(ritmoUsado)} bonos por día</span>,
                los {totalBonos} se completan el{" "}
                <span className="font-extrabold">
                  {formatArtDate(fechaEstimada)}
                </span>
                {llegaTarde && (
                  <span className="font-bold text-rotary-cardinal">
                    {" "}
                    &mdash; después del sorteo
                  </span>
                )}
                .
              </>
            ) : (
              <>
                En los últimos 7 días no se vendió ningún bono, así que no hay
                ritmo con el que proyectar una fecha.
              </>
            )}
          </p>

          {/* Pregunta 2: ¿a qué ritmo habría que ir? */}
          {ritmoNecesario !== null && diasHastaSorteo !== null ? (
            <p className="text-base text-rotary-ink">
              Para tenerlos vendidos antes del sorteo del{" "}
              {formatDrawDate(drawDate)} &mdash; faltan{" "}
              <span className="font-bold">{diasHastaSorteo} días</span> &mdash;
              hay que vender{" "}
              <span className="font-extrabold">
                {ritmo(ritmoNecesario)} bonos por día
              </span>
              .
            </p>
          ) : (
            <p className="text-base text-rotary-ink/60">
              Sin fecha de sorteo cargada no se puede calcular el ritmo
              necesario.
            </p>
          )}
        </>
      )}

      <p className="text-xs text-rotary-ink/50">
        {usaHistorico
          ? `La proyección usa el promedio desde la primera venta (${ritmo(
              ritmoHistorico
            )} por día) porque en los últimos 7 días no hubo ventas.`
          : `La proyección usa los últimos 7 días (${ritmo(
              ritmoReciente
            )} por día). El promedio desde la primera venta es ${ritmo(
              ritmoHistorico
            )} por día.`}{" "}
        Cuenta reservas además de pagos confirmados, igual que el resto del
        panel.
      </p>
    </div>
  );
}
