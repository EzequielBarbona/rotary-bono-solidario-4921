import { startOfArtDay } from "@/lib/dates";

const DIA_MS = 24 * 60 * 60 * 1000;

export type VentaParaProyeccion = {
  createdAt: Date;
  ticketCount: number;
};

export type Proyeccion = {
  vendidos: number;
  restantes: number;
  /** Bonos por dia de los ultimos 7 dias. */
  ritmoReciente: number;
  /** Bonos por dia desde la primera venta. */
  ritmoHistorico: number;
  /** Ritmo con el que se proyecta, y de donde salio. */
  ritmoUsado: number;
  usaHistorico: boolean;
  /** Fecha estimada de agotar los 1000, o null si al ritmo actual no llega nunca. */
  fechaEstimada: Date | null;
  /** Dias que faltan para el sorteo, o null si todavia no hay fecha. */
  diasHastaSorteo: number | null;
  /** Bonos por dia que hacen falta para llegar al sorteo con todo vendido. */
  ritmoNecesario: number | null;
  /** La proyeccion cae despues del sorteo. */
  llegaTarde: boolean;
  completo: boolean;
};

/** Dias enteros entre dos instantes, contados por dia argentino. */
function diasEntre(desde: Date, hasta: Date): number {
  return Math.round(
    (startOfArtDay(hasta).getTime() - startOfArtDay(desde).getTime()) / DIA_MS
  );
}

/**
 * Proyeccion de cuando se completan los 1000 bonos y a que ritmo habria
 * que vender para llegar al sorteo con todo vendido.
 *
 * El ritmo de referencia son los ultimos 7 dias y no el promedio desde el
 * arranque: en una venta que dura meses, lo que paso hace ocho semanas no
 * dice nada de lo que va a pasar manana. Si en esos 7 dias no se vendio
 * nada se cae al promedio historico, que al menos da un numero; que la
 * proyeccion diga "nunca" cuando hubo una semana floja seria alarmista.
 */
export function proyectarVentas({
  ventas,
  totalBonos,
  drawDate,
  ahora = new Date(),
}: {
  ventas: VentaParaProyeccion[];
  totalBonos: number;
  /** "YYYY-MM-DD", o vacio si el sorteo todavia no tiene fecha. */
  drawDate: string;
  ahora?: Date;
}): Proyeccion | null {
  if (ventas.length === 0) return null;

  const vendidos = ventas.reduce((s, v) => s + v.ticketCount, 0);
  const restantes = Math.max(0, totalBonos - vendidos);

  const primera = ventas.reduce(
    (min, v) => (v.createdAt < min ? v.createdAt : min),
    ventas[0].createdAt
  );
  // El primer dia cuenta como un dia, no como cero: si se vendieron 10
  // bonos hoy, el ritmo es 10 por dia y no una division por cero.
  const diasCorridos = Math.max(1, diasEntre(primera, ahora) + 1);
  const ritmoHistorico = vendidos / diasCorridos;

  const desdeHace7 = startOfArtDay(ahora, 6);
  const bonos7 = ventas
    .filter((v) => v.createdAt >= desdeHace7)
    .reduce((s, v) => s + v.ticketCount, 0);
  // Se divide por los dias que la venta lleva abierta, no siempre por 7:
  // en la semana del lanzamiento no hubo 7 dias para vender, y dividir
  // igual por 7 hunde el ritmo a un septimo del real y proyecta fechas
  // absurdas justo cuando mas se mira el tablero.
  const ritmoReciente = bonos7 / Math.min(7, diasCorridos);

  const usaHistorico = ritmoReciente === 0 && ritmoHistorico > 0;
  const ritmoUsado = usaHistorico ? ritmoHistorico : ritmoReciente;

  const completo = restantes === 0;
  const fechaEstimada =
    completo || ritmoUsado <= 0
      ? null
      : new Date(
          startOfArtDay(ahora).getTime() +
            Math.ceil(restantes / ritmoUsado) * DIA_MS
        );

  const diasHastaSorteo = drawDate.trim()
    ? diasEntre(ahora, new Date(`${drawDate}T12:00:00.000Z`))
    : null;

  // Si el sorteo ya pasó o es hoy no tiene sentido pedir un ritmo diario.
  const ritmoNecesario =
    diasHastaSorteo !== null && diasHastaSorteo > 0 && !completo
      ? restantes / diasHastaSorteo
      : null;

  const llegaTarde =
    fechaEstimada !== null &&
    diasHastaSorteo !== null &&
    diasEntre(ahora, fechaEstimada) > diasHastaSorteo;

  return {
    vendidos,
    restantes,
    ritmoReciente,
    ritmoHistorico,
    ritmoUsado,
    usaHistorico,
    fechaEstimada,
    diasHastaSorteo,
    ritmoNecesario,
    llegaTarde,
    completo,
  };
}
