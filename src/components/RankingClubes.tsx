import { esGrupoAgrupado, type FilaClub } from "@/lib/ranking";

const TOPE = 10;

/**
 * El ranking de clubes tal como lo ve cualquiera que entre al sitio.
 *
 * Solo muestra la cantidad de bonos y no los montos: la idea es la
 * competencia entre clubes, no exponer cuanta plata movio cada uno.
 */
export function RankingClubes({ filas }: { filas: FilaClub[] }) {
  const clubes = filas.filter((f) => !esGrupoAgrupado(f.club));
  const agrupados = filas.filter((f) => esGrupoAgrupado(f.club));

  if (clubes.length === 0) return null;

  // Cortar en el puesto 10 a secas puede dejar afuera a un club empatado
  // con el ultimo que si entra, y eso se lee como arbitrario: si hay
  // empate en el limite, entran todos los del mismo puesto.
  let corte = Math.min(TOPE, clubes.length);
  while (corte < clubes.length && clubes[corte].puesto === clubes[corte - 1].puesto) {
    corte += 1;
  }
  const podio = clubes.slice(0, corte);
  const restantes = clubes.length - podio.length;

  // Fondo apenas tenido: abajo viene otra seccion blanca y si las dos
  // fueran blancas se leerian como una sola.
  return (
    <section className="bg-rotary-azure/5 px-4 py-16">
      <div className="max-w-xl w-full mx-auto flex flex-col items-center gap-5 text-center">
        <span className="uppercase tracking-widest text-sm font-semibold text-rotary-azure">
          Cómo va la copa entre clubes
        </span>
        <h2 className="text-3xl font-extrabold text-rotary-ink text-balance">
          Los clubes que más bonos vendieron
        </h2>

        <ol className="w-full flex flex-col mt-2">
          {podio.map((fila) => (
            <li
              key={fila.club}
              className={`flex items-center gap-4 py-3 border-b border-rotary-ink/10 ${
                fila.puesto === 1 ? "bg-rotary-gold/10 rounded-lg px-3" : "px-3"
              }`}
            >
              <span
                className={`w-8 shrink-0 text-right tabular-nums font-extrabold ${
                  fila.puesto === 1
                    ? "text-rotary-gold-dark text-xl"
                    : "text-rotary-ink/40"
                }`}
              >
                {fila.puesto}
              </span>
              <span className="flex-1 text-left text-lg text-rotary-ink">
                {fila.club}
              </span>
              <span className="shrink-0 tabular-nums text-lg font-bold text-rotary-azure">
                {fila.bonos}
              </span>
            </li>
          ))}
        </ol>

        {restantes > 0 && (
          <p className="text-sm text-rotary-ink/60">
            {restantes === 1
              ? "Y un club más que ya vendió bonos."
              : `Y ${restantes} clubes más que ya vendieron bonos.`}
          </p>
        )}

        {agrupados.length > 0 && (
          <p className="text-sm text-rotary-ink/60">
            {agrupados.map((f, i) => (
              <span key={f.club}>
                {i > 0 && " · "}
                {f.club}: <span className="font-semibold">{f.bonos}</span> bono
                {f.bonos !== 1 ? "s" : ""}
              </span>
            ))}
          </p>
        )}

        <p className="text-sm text-rotary-ink/60 mt-2">
          Al comprar elegís tu club, y tu bono suma a su cuenta. Todo lo
          recaudado va al mismo lugar: la lucha contra la polio.
        </p>
      </div>
    </section>
  );
}
