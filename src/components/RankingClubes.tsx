import { DISTRICT_CLUBS } from "@/lib/clubs";
import { childrenProtected } from "@/lib/impact";
import { esGrupoAgrupado, type FilaClub } from "@/lib/ranking";

const TOPE = 10;

/**
 * La copa antes de que se venda el primer bono.
 *
 * Se muestra igual, con todos en cero, en vez de esconder la seccion: es
 * la forma de que los clubes vean que la competencia existe antes de que
 * haya algo que mirar. No inventamos ventas de ejemplo, que ademas
 * moverian el contador de chicos protegidos con plata que no entro.
 *
 * El orden es alfabetico y esta dicho: sin ventas no hay puestos, y un
 * orden arbitrario sin explicar se lee como que esos clubes van ganando.
 */
function CopaEnCero() {
  const primeros = DISTRICT_CLUBS.slice(0, TOPE);
  const restantes = DISTRICT_CLUBS.length - primeros.length;

  return (
    <section className="bg-rotary-azure/5 px-4 py-16">
      <div className="max-w-xl w-full mx-auto flex flex-col items-center gap-5 text-center">
        <span className="uppercase tracking-widest text-sm font-semibold text-rotary-azure">
          Cómo va la copa entre clubes
        </span>
        <h2 className="text-3xl font-extrabold text-rotary-ink text-balance">
          Los clubes que más vacunaron
        </h2>
        <p className="text-base text-rotary-ink/70 -mt-2">
          La copa recién arranca: los {DISTRICT_CLUBS.length} clubes del
          distrito están en cero. Acá se va a ver cuántos chicos ayudó a
          vacunar cada uno.
        </p>

        <ol className="w-full flex flex-col mt-2">
          {primeros.map((club) => (
            <li
              key={club}
              className="flex items-center gap-4 py-3 px-3 border-b border-rotary-ink/10"
            >
              <span className="w-8 shrink-0" />
              <span className="flex-1 text-left text-lg text-rotary-ink/70">
                {club}
              </span>
              <span className="shrink-0 tabular-nums text-lg font-bold text-rotary-ink/30">
                0
              </span>
            </li>
          ))}
        </ol>

        <p className="text-sm text-rotary-ink/60">
          Y {restantes} clubes más. Por ahora van en orden alfabético; cuando
          empiecen las ventas se ordenan por chicos vacunados.
        </p>

        <p className="text-sm text-rotary-ink/60 mt-2">
          Al comprar elegís tu club, y tu bono suma a su cuenta. Todo lo
          recaudado va al mismo lugar: la lucha contra la polio.
        </p>
      </div>
    </section>
  );
}

/**
 * El ranking de clubes tal como lo ve cualquiera que entre al sitio.
 *
 * Cuenta chicos vacunados y no bonos ni pesos: la competencia entre
 * clubes se mide en lo que el bono consigue, no en cuanta plata movio
 * cada uno. El panel de administracion si lleva la cuenta por bono.
 *
 * Cada club se convierte por separado y childrenProtected redondea para
 * abajo, asi que la suma de las filas puede dar un poco menos que el
 * contador general de la home. Preferimos quedarnos cortos por club antes
 * que atribuirle a alguno un chico que no llego a financiar.
 */
export function RankingClubes({ filas }: { filas: FilaClub[] }) {
  const clubes = filas.filter((f) => !esGrupoAgrupado(f.club));
  const agrupados = filas.filter((f) => esGrupoAgrupado(f.club));

  if (clubes.length === 0) return <CopaEnCero />;

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
          Los clubes que más vacunaron
        </h2>
        <p className="text-base text-rotary-ink/70 -mt-2">
          Chicos protegidos contra la polio gracias a los bonos que vendió
          cada club.
        </p>

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
                {childrenProtected(fila.reservado).toLocaleString("es-AR")}
              </span>
            </li>
          ))}
        </ol>

        {restantes > 0 && (
          <p className="text-sm text-rotary-ink/60">
            {restantes === 1
              ? "Y un club más que ya está sumando."
              : `Y ${restantes} clubes más que ya están sumando.`}
          </p>
        )}

        {agrupados.length > 0 && (
          <p className="text-sm text-rotary-ink/60">
            {agrupados.map((f, i) => {
              const chicos = childrenProtected(f.reservado);
              return (
                <span key={f.club}>
                  {i > 0 && " · "}
                  {f.club}:{" "}
                  <span className="font-semibold">
                    {chicos.toLocaleString("es-AR")}
                  </span>{" "}
                  chico{chicos !== 1 ? "s" : ""}
                </span>
              );
            })}
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
