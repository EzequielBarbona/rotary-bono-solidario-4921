import Image from "next/image";
import Link from "next/link";
import { raffleConfig } from "@/lib/config";
import { childrenProtected, pictogramScale } from "@/lib/impact";
import { formatDateArs } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { releaseExpiredHolds } from "@/lib/tickets";
import { PersonPictogram } from "@/components/PersonPictogram";

// El contador de vacunas tiene que reflejar las ordenes en tiempo real,
// no un valor congelado en el build.
export const dynamic = "force-dynamic";

export default async function Home() {
  // Cuenta reservas (PENDIENTE) y pagos confirmados (PAGADO): las figuras
  // se colorean apenas alguien reserva, no recien cuando se confirma el
  // pago. Liberamos las reservas vencidas antes de contar para que el
  // numero no incluya gente que reservo y nunca volvio a pagar.
  await releaseExpiredHolds();
  const { _sum } = await prisma.order.aggregate({
    where: { status: { in: ["PENDIENTE", "PAGADO"] } },
    _sum: { totalAmount: true },
  });
  const kidsSoFar = childrenProtected(_sum.totalAmount ?? 0);
  const kidsGoal = childrenProtected(raffleConfig.totalTickets * raffleConfig.ticketPriceArs);
  const pictogram = pictogramScale(kidsGoal, kidsSoFar, 400, 10);

  return (
    <main className="flex-1 flex flex-col">
      <section className="relative overflow-hidden bg-gradient-to-br from-rotary-azure to-rotary-azure-dark text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full border-[24px] border-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 bottom-[-6rem] w-56 h-56 rounded-full border-[16px] border-rotary-gold/25"
        />
        <div className="relative max-w-3xl w-full mx-auto px-4 pt-12 pb-20 flex flex-col items-center gap-5 text-center">
          <span className="uppercase tracking-widest text-sm font-semibold text-rotary-gold">
            Subcomité PolioPlus &middot; Distrito Rotary 4921
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-balance">
            {raffleConfig.title}
          </h1>
          <p className="text-lg text-white/90">
            Fecha del sorteo {formatDateArs(raffleConfig.drawDate)}
          </p>
          <Link
            href="/comprar/cantidad"
            className="mt-4 bg-rotary-gold text-rotary-ink font-bold text-lg px-10 py-4 rounded-full hover:bg-rotary-gold-dark transition-colors"
          >
            Comprar bono solidario
          </Link>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="max-w-2xl w-full mx-auto flex flex-col items-center gap-5 text-center">
          <span className="uppercase tracking-widest text-sm font-semibold text-rotary-azure">
            El premio
          </span>
          <svg
            aria-hidden
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            className="text-rotary-gold"
          >
            <rect
              x="3"
              y="9"
              width="14"
              height="11"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M8 9V7a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0114 7v2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line x1="3" y1="14.5" x2="17" y2="14.5" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="18.5" cy="4.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
            <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <line x1="20.5" y1="4.5" x2="21.4" y2="4.5" />
              <line x1="16.5" y1="4.5" x2="15.6" y2="4.5" />
              <line x1="18.5" y1="2.5" x2="18.5" y2="1.6" />
              <line x1="18.5" y1="6.5" x2="18.5" y2="7.4" />
              <line x1="19.91" y1="3.09" x2="20.55" y2="2.45" />
              <line x1="17.09" y1="3.09" x2="16.45" y2="2.45" />
              <line x1="17.09" y1="5.91" x2="16.45" y2="6.55" />
              <line x1="19.91" y1="5.91" x2="20.55" y2="6.55" />
            </g>
          </svg>
          <h2 className="text-3xl font-extrabold text-rotary-ink text-balance">
            Estadía de 5 noches para 2 personas
          </h2>
          <p className="text-rotary-ink/70 text-lg">A elegir entre:</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="bg-rotary-azure/10 text-rotary-azure font-bold px-5 py-2 rounded-full">
              Bariloche
            </span>
            <span className="text-rotary-ink/40 font-medium">o</span>
            <span className="bg-rotary-azure/10 text-rotary-azure font-bold px-5 py-2 rounded-full">
              Las Grutas
            </span>
          </div>
        </div>
      </section>

      <section className="bg-rotary-teal text-white px-4 py-16">
        <div className="max-w-2xl w-full mx-auto flex flex-col items-center gap-4 text-center">
          <Image
            src="/brand/end-polio-now.png"
            alt="End Polio Now"
            width={80}
            height={80}
            className="rounded-xl ring-4 ring-white/20"
          />
          <h2 className="text-2xl font-extrabold">Cómo ayuda tu compra</h2>
          <p className="text-white/90 leading-relaxed">
            Lo recaudado con este bono solidario va íntegramente al programa{" "}
            <span className="font-bold text-rotary-gold">PolioPlus</span> de Rotary
            International, que financia campañas de vacunación para Erradicar la Polio
            en el mundo. Cada número que comprás suma a ese objetivo.
          </p>

          <div className="mt-2 border-t border-white/20 pt-6 w-full flex flex-col items-center gap-2">
            {kidsSoFar > 0 ? (
              <>
                <span className="text-5xl font-extrabold text-rotary-gold">{kidsSoFar}</span>
                <span className="text-white/90">
                  chico{kidsSoFar !== 1 ? "s" : ""} protegido{kidsSoFar !== 1 ? "s" : ""} contra
                  la polio gracias a este bono solidario
                </span>
              </>
            ) : (
              <span className="text-white/90">
                Todavía no hay bonos confirmados. ¡Sé el primero en sumar!
              </span>
            )}

            {kidsGoal > 0 && (
              <div className="w-full flex flex-col items-center gap-3 mt-4">
                <PersonPictogram
                  total={pictogram.displayTotal}
                  filled={pictogram.displayFilled}
                  colorFilled="#f7a81b"
                  colorEmpty="rgba(255,255,255,0.3)"
                  className="w-full max-w-xl flex justify-center"
                />
                <p className="text-sm text-white/80">
                  Cada figura representa {pictogram.unitsPerIcon} niños o niñas. Si cumplimos
                  nuestro objetivo estaremos ayudando a más de{" "}
                  <span className="font-bold text-white">6500</span> infantes.
                </p>

                <details className="text-xs text-white/50 mt-1">
                  <summary className="cursor-pointer hover:text-white/75 transition-colors">
                    ¿Cómo hicimos el cálculo?
                  </summary>
                  <div className="mt-3 max-w-md mx-auto text-left leading-relaxed bg-white/10 rounded-lg p-4 text-white/80">
                    <p>
                      Rotary calcula que con{" "}
                      <span className="font-semibold text-white">
                        US$ {raffleConfig.costPerChildUsd}
                      </span>{" "}
                      se puede proteger completamente a un chico contra la polio (la
                      vacuna y toda la logística para aplicarla), según sus propios
                      datos publicados.
                    </p>
                    <p className="mt-2">
                      Convertimos el precio del bono a dólares con un tipo de cambio
                      de referencia que actualizamos de vez en cuando (hoy:{" "}
                      <span className="font-semibold text-white">
                        ${raffleConfig.usdArsRate.toLocaleString("es-AR")} ARS
                      </span>{" "}
                      = US$1).
                    </p>
                    {raffleConfig.gatesMatchMultiplier > 1 && (
                      <p className="mt-2">
                        Como lo recaudado va al PolioPlus Fund oficial de Rotary, la
                        Fundación Gates dona el doble de lo que se junta, así que el
                        aporte real se multiplica por{" "}
                        <span className="font-semibold text-white">
                          {raffleConfig.gatesMatchMultiplier}
                        </span>
                        .
                      </p>
                    )}
                    <p className="mt-2">
                      Con esas cuentas calculamos cuántos chicos protege cada bono, y
                      sumamos todos los bonos ya confirmados para el número de arriba.
                    </p>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="max-w-lg w-full mx-auto flex flex-col items-center gap-4 text-center">
          <p className="text-rotary-ink text-lg">
            Elegí tus números antes de que se agoten.
          </p>
          <Link
            href="/comprar/cantidad"
            className="bg-rotary-azure text-white font-bold text-lg px-10 py-4 rounded-full hover:bg-rotary-azure-dark transition-colors"
          >
            Comprar bono solidario
          </Link>
        </div>
      </section>
    </main>
  );
}
