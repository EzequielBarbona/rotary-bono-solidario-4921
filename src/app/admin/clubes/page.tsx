import Link from "next/link";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { formatArs } from "@/lib/format";
import { DISTRICT_CLUBS, rutaDeClub } from "@/lib/clubs";
import { raffleConfig } from "@/lib/config";
import { esGrupoAgrupado, rankingPorClub } from "@/lib/ranking";
import { getFlag, RANKING_PUBLICO } from "@/lib/settings";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { CopyButton } from "@/components/CopyButton";
import { PublicarRankingToggle } from "@/components/admin/PublicarRankingToggle";

// Es un ranking en vivo: nunca cacheado.
export const dynamic = "force-dynamic";

export default async function VentasPorClubPage() {
  if (!(await isAdminSessionActive())) {
    return <AdminLogin />;
  }

  const [filas, publicado] = await Promise.all([
    rankingPorClub(),
    getFlag(RANKING_PUBLICO),
  ]);

  const clubesConVentas = filas.filter((f) => !esGrupoAgrupado(f.club)).length;
  const totalBonos = filas.reduce((s, f) => s + f.bonos, 0);
  const totalReservado = filas.reduce((s, f) => s + f.reservado, 0);
  const totalConfirmado = filas.reduce((s, f) => s + f.confirmado, 0);

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-extrabold text-rotary-ink">Ventas por club</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/ventas" className="text-sm text-rotary-azure hover:underline">
            Ventas por semana
          </Link>
          <Link href="/admin" className="text-sm text-rotary-azure hover:underline">
            ‹ Volver al panel
          </Link>
        </div>
      </div>

      <PublicarRankingToggle inicial={publicado} />

      <p className="text-sm text-rotary-ink/70">
        Cada bono se cuenta en el club que invitó al comprador, sea socio o
        no. Quienes indicaron un club de otro distrito o llegaron por su
        cuenta aparecen agrupados al final: suman al total recaudado, no al
        ranking entre clubes del 4921.
      </p>

      {/* Los links tienen que estar acá, y para los 121 clubes: el que
          todavía no vendió nada es justamente el que más necesita el suyo,
          y si el presidente se lo tiene que pedir a alguien no lo usa. */}
      <details className="border border-rotary-ink/10 rounded-lg px-4 py-3">
        <summary className="cursor-pointer text-sm font-bold text-rotary-ink">
          Links de invitación de cada club
        </summary>
        <p className="mt-3 text-sm text-rotary-ink/70">
          Mandale a cada club el suyo. Quien compre entrando por ese link
          suma a ese club aunque no sea rotario y no sepa qué contestar en el
          formulario. El link limpio del sitio sigue siendo el de la difusión
          oficial del distrito.
        </p>
        <ul className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1">
          {DISTRICT_CLUBS.map((club) => (
            <li key={club} className="text-sm text-rotary-ink/80 py-0.5">
              {club}
              <CopyButton
                value={`${raffleConfig.siteUrl}${rutaDeClub(club)}`}
                label={`Copiar el link de invitación de ${club}`}
                texto="Copiar link"
              />
            </li>
          ))}
        </ul>
      </details>

      {filas.length === 0 ? (
        <p className="text-base text-rotary-ink/60">Todavía no hay ventas registradas.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="border border-rotary-ink/10 rounded-lg px-4 py-2">
              <span className="font-extrabold">{clubesConVentas}</span>{" "}
              <span className="text-rotary-ink/70">
                de {DISTRICT_CLUBS.length} clubes vendieron al menos un bono
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-rotary-ink/60 border-b border-rotary-ink/15">
                  <th className="py-2 pr-3 font-semibold w-8" />
                  <th className="py-2 pr-4 font-semibold">Club</th>
                  <th className="py-2 pr-4 font-semibold text-right">Bonos</th>
                  <th className="py-2 pr-4 font-semibold text-right">Reservado</th>
                  <th className="py-2 font-semibold text-right">Confirmado</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((fila) => {
                  const grupo = esGrupoAgrupado(fila.club);
                  return (
                    <tr
                      key={fila.club}
                      className={`border-b border-rotary-ink/10 ${
                        grupo ? "text-rotary-ink/60 italic" : ""
                      } ${fila.puesto === 1 ? "bg-rotary-gold/10" : ""}`}
                    >
                      <td className="py-2 pr-3 text-right tabular-nums text-rotary-ink/50">
                        {fila.puesto ?? ""}
                      </td>
                      <td className="py-2 pr-4 text-rotary-ink">{fila.club}</td>
                      <td className="py-2 pr-4 text-right tabular-nums font-medium">
                        {fila.bonos}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {formatArs(fila.reservado)}
                      </td>
                      <td className="py-2 text-right tabular-nums text-rotary-ink/70">
                        {formatArs(fila.confirmado)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold text-rotary-ink border-t-2 border-rotary-ink/20">
                  <td />
                  <td className="py-3 pr-4">Total</td>
                  <td className="py-3 pr-4 text-right tabular-nums">{totalBonos}</td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {formatArs(totalReservado)}
                  </td>
                  <td className="py-3 text-right tabular-nums">
                    {formatArs(totalConfirmado)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      <p className="text-xs text-rotary-ink/50">
        Los clubes que todavía no vendieron ningún bono no aparecen en la tabla.
        Esta misma información viaja en el Excel, en la hoja «Por club».
      </p>
    </main>
  );
}
