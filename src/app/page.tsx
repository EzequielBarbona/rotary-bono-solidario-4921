import Image from "next/image";
import Link from "next/link";
import { raffleConfig } from "@/lib/config";
import { childrenProtected, pictogramScale } from "@/lib/impact";
import { prisma } from "@/lib/prisma";
import { PersonPictogram } from "@/components/PersonPictogram";

// El contador de vacunas tiene que reflejar las ordenes confirmadas en
// tiempo real, no un valor congelado en el build.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { _sum } = await prisma.order.aggregate({
    where: { status: "PAGADO" },
    _sum: { totalAmount: true },
  });
  const kidsSoFar = childrenProtected(_sum.totalAmount ?? 0);
  const kidsGoal = childrenProtected(raffleConfig.totalTickets * raffleConfig.ticketPriceArs);
  const pictogram = pictogramScale(kidsGoal, kidsSoFar);

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
          <div className="flex items-center gap-5">
            <Image
              src="/brand/rotary-distrito-4921-white.png"
              alt="Rotary Distrito 4921"
              width={198}
              height={103}
              priority
              className="h-16 sm:h-20 w-auto"
            />
            <Image
              src="/brand/end-polio-now.png"
              alt="End Polio Now"
              width={80}
              height={80}
              priority
              className="h-14 sm:h-16 w-14 sm:w-16 rounded-xl"
            />
          </div>
          <span className="uppercase tracking-widest text-sm font-semibold text-rotary-gold">
            Subcomite PolioPlus &middot; Distrito Rotary 4921
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-balance">
            {raffleConfig.title}
          </h1>
          <p className="text-lg text-white/90">Sorteo: {raffleConfig.drawDate}</p>
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
            <path
              d="M3 21l1.6-6.4a2 2 0 011.94-1.6h10.92a2 2 0 011.94 1.6L21 21M6 13V8a2 2 0 012-2h8a2 2 0 012 2v5M9 6V4.5A1.5 1.5 0 0110.5 3h3A1.5 1.5 0 0115 4.5V6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2 className="text-3xl font-extrabold text-rotary-ink text-balance">
            Estadia de 5 noches para 2 personas
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
          <h2 className="text-2xl font-extrabold">Como ayuda tu compra</h2>
          <p className="text-white/90 leading-relaxed">
            Lo recaudado con este bono solidario va integramente al programa{" "}
            <span className="font-bold text-rotary-gold">PolioPlus</span> del
            Distrito Rotary 4921, que financia campanas de vacunacion para
            erradicar la polio en el mundo, en conjunto con la OMS, UNICEF y la
            Fundacion Gates. Cada numero que comprás suma a ese objetivo.
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
                Todavia no hay bonos confirmados. ¡Sé el primero en sumar!
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
                  {pictogram.unitsPerIcon > 1
                    ? `Cada figura representa ${pictogram.unitsPerIcon} chicos. `
                    : "Cada figura es un chico protegido. "}
                  Nuestra meta si se venden los{" "}
                  {raffleConfig.totalTickets.toLocaleString("es-AR")} numeros: aproximadamente{" "}
                  <span className="font-bold text-white">
                    {kidsGoal.toLocaleString("es-AR")}
                  </span>{" "}
                  chicos.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="max-w-lg w-full mx-auto flex flex-col items-center gap-4 text-center">
          <p className="text-rotary-ink text-lg">
            Elegi tus numeros antes de que se agoten.
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
