import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { formatArs } from "@/lib/format";
import { ART_WEEK_MS, formatArtDayMonth, startOfArtWeek } from "@/lib/dates";
import { AdminLogin } from "@/components/admin/AdminLogin";

// Los numeros tienen que reflejar las ordenes en tiempo real.
export const dynamic = "force-dynamic";

type SemanaFila = {
  inicio: Date;
  bonos: number;
  reservado: number;
  confirmado: number;
  acumulado: number;
};

export default async function VentasPorSemanaPage() {
  if (!(await isAdminSessionActive())) {
    return <AdminLogin />;
  }

  // Mismo criterio que los totales del panel: cuenta lo reservado (aunque
  // un admin todavia no lo haya confirmado), porque lo que se cruza contra
  // el resumen bancario es la plata que entro, no el clic de confirmacion.
  const ordenes = await prisma.order.findMany({
    where: { status: { in: ["PENDIENTE", "PAGADO"] } },
    select: { createdAt: true, totalAmount: true, ticketCount: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  const semanas: SemanaFila[] = [];

  if (ordenes.length > 0) {
    const porSemana = new Map<number, { bonos: number; reservado: number; confirmado: number }>();
    for (const orden of ordenes) {
      const clave = startOfArtWeek(orden.createdAt).getTime();
      const acc = porSemana.get(clave) ?? { bonos: 0, reservado: 0, confirmado: 0 };
      acc.bonos += orden.ticketCount;
      acc.reservado += orden.totalAmount;
      if (orden.status === "PAGADO") acc.confirmado += orden.totalAmount;
      porSemana.set(clave, acc);
    }

    // Recorremos semana por semana desde la primera venta hasta hoy, para
    // que las semanas sin ventas aparezcan en cero en vez de desaparecer:
    // un hueco tambien es informacion.
    const primera = startOfArtWeek(ordenes[0].createdAt).getTime();
    const actual = startOfArtWeek(new Date()).getTime();
    let acumulado = 0;

    for (let t = primera; t <= actual; t += ART_WEEK_MS) {
      const datos = porSemana.get(t) ?? { bonos: 0, reservado: 0, confirmado: 0 };
      acumulado += datos.reservado;
      semanas.push({ inicio: new Date(t), ...datos, acumulado });
    }
    semanas.reverse();
  }

  const semanaActual = startOfArtWeek(new Date()).getTime();
  const totalBonos = semanas.reduce((s, f) => s + f.bonos, 0);
  const totalReservado = semanas.reduce((s, f) => s + f.reservado, 0);
  const totalConfirmado = semanas.reduce((s, f) => s + f.confirmado, 0);

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-extrabold text-rotary-ink">Ventas por semana</h1>
        <Link href="/admin" className="text-sm text-rotary-azure hover:underline">
          ‹ Volver al panel
        </Link>
      </div>

      <p className="text-sm text-rotary-ink/70">
        Cada semana va de lunes a domingo, en horario argentino, y se cuenta por
        la fecha en que se hizo la reserva. Incluye reservas que todavía no
        confirmó un administrador, para poder cruzarlo contra el resumen
        bancario.
      </p>

      {semanas.length === 0 ? (
        <p className="text-base text-rotary-ink/60">Todavía no hay ventas registradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-rotary-ink/60 border-b border-rotary-ink/15">
                <th className="py-2 pr-4 font-semibold">Semana</th>
                <th className="py-2 pr-4 font-semibold text-right">Bonos</th>
                <th className="py-2 pr-4 font-semibold text-right">Reservado</th>
                <th className="py-2 pr-4 font-semibold text-right">Confirmado</th>
                <th className="py-2 font-semibold text-right">Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {semanas.map((fila) => {
                const enCurso = fila.inicio.getTime() === semanaActual;
                const fin = new Date(fila.inicio.getTime() + ART_WEEK_MS - 1);
                return (
                  <tr
                    key={fila.inicio.toISOString()}
                    className={`border-b border-rotary-ink/10 ${
                      enCurso ? "bg-rotary-gold/10" : ""
                    }`}
                  >
                    <td className="py-2 pr-4 text-rotary-ink">
                      {formatArtDayMonth(fila.inicio)} al {formatArtDayMonth(fin)}
                      {enCurso && (
                        <span className="ml-2 text-xs font-semibold text-rotary-gold-dark">
                          en curso
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{fila.bonos}</td>
                    <td className="py-2 pr-4 text-right tabular-nums font-medium">
                      {formatArs(fila.reservado)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-rotary-ink/70">
                      {formatArs(fila.confirmado)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-rotary-ink/70">
                      {formatArs(fila.acumulado)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-bold text-rotary-ink border-t-2 border-rotary-ink/20">
                <td className="py-3 pr-4">Total</td>
                <td className="py-3 pr-4 text-right tabular-nums">{totalBonos}</td>
                <td className="py-3 pr-4 text-right tabular-nums">
                  {formatArs(totalReservado)}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums">
                  {formatArs(totalConfirmado)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="text-xs text-rotary-ink/50">
        La semana en curso todavía se está moviendo: recién queda cerrada el
        domingo a la noche.
      </p>
    </main>
  );
}
