import Image from "next/image";
import { raffleConfig } from "@/lib/config";
import { childrenProtected, pictogramScale } from "@/lib/impact";
import { formatArs } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { PersonPictogram } from "@/components/PersonPictogram";
import { RankingClubes } from "@/components/RankingClubes";
import { ShareWhatsAppButton } from "@/components/ShareWhatsAppButton";
import { CompartirInstagram } from "@/components/CompartirInstagram";
import { CuentaRegresiva } from "@/components/CuentaRegresiva";
import { BotonComprar } from "@/components/BotonComprar";
import { rankingPorClub } from "@/lib/ranking";
import { getFlag, RANKING_PUBLICO } from "@/lib/settings";
import { conLimite } from "@/lib/con-limite";
import { ventaCerrada } from "@/lib/cierre";
import { formatArtDayTime } from "@/lib/dates";
import { conMemoriaCorta } from "@/lib/memoria-corta";
import { cookies } from "next/headers";
import { CLUB_COOKIE, clubDeSlug, RUTA_DISTRITO, slugDeClub } from "@/lib/clubs";
import {
  DESTINOS,
  ECUACION,
  GANCHO,
  LEMA,
  MARCA,
  RECORDATORIO,
  SORTEO,
} from "@/lib/copy";

// El contador de vacunas tiene que reflejar las ordenes en tiempo real,
// no un valor congelado en el build.
export const dynamic = "force-dynamic";

export default async function Home() {
  // Cuenta reservas (PENDIENTE) y pagos confirmados (PAGADO): las figuras
  // se colorean apenas alguien reserva, no recien cuando se confirma el
  // pago. Las reservas ya no vencen solas, asi que si alguien reserva y
  // nunca paga el numero queda contado hasta que un admin lo de de baja.
  //
  // Las consultas van con techo de tiempo: si la base se cuelga, la
  // pagina se dibuja igual con los numeros en cero en vez de dejar al
  // visitante mirando "el servidor no responde". Perder el contador es
  // molesto; perder el boton de comprar es perder la venta.
  const recaudado = await conLimite(
    prisma.order
      .aggregate({
        where: { status: { in: ["PENDIENTE", "PAGADO"] } },
        _sum: { totalAmount: true },
      })
      .then((r) => r._sum.totalAmount ?? 0),
    0
  );
  // El ranking entre clubes solo se muestra si el subcomite lo publico
  // desde el panel; mientras este apagado ni siquiera se consulta.
  const mostrarRanking = await conLimite(getFlag(RANKING_PUBLICO), false);
  const filasClubes = mostrarRanking ? await conLimite(rankingPorClub(), []) : [];
  const kidsSoFar = childrenProtected(recaudado);
  const kidsGoal = childrenProtected(raffleConfig.totalTickets * raffleConfig.ticketPriceArs);
  const pictogram = pictogramScale(kidsGoal, kidsSoFar, 400, 10);

  /*
   * El volante que se ofrece para imprimir es el del club por el que entro
   * la visita: quien llego por el link de Cipolletti reparte el de
   * Cipolletti y las ventas le quedan a Cipolletti. Sin club, el del
   * distrito, que no le acredita a nadie.
   */
  const slugVisita = (await cookies()).get(CLUB_COOKIE)?.value;
  const clubVisita = slugVisita ? clubDeSlug(slugVisita) : null;
  const volante = clubVisita
    ? `/flyer/club/${slugDeClub(clubVisita)}`
    : "/flyer/distrito";

  /*
   * El cierre de la venta, para la cuenta regresiva. Se resuelve aca
   * porque el instante y su version en palabras tienen que salir del
   * servidor: el navegador no ve las variables de entorno y, si cada uno
   * armara el texto por su lado, el primer dibujo no coincidiria.
   */
  const cierraEn = raffleConfig.salesCloseAt
    ? new Date(raffleConfig.salesCloseAt)
    : null;
  const cierre =
    cierraEn && !Number.isNaN(cierraEn.getTime())
      ? {
          cierraEn: cierraEn.getTime(),
          /*
           * La página es force-dynamic: se dibuja de nuevo en cada visita,
           * así que leer el reloj del servidor es justamente lo que hace
           * falta. La regla apunta a los componentes del navegador, que sí
           * se vuelven a dibujar solos.
           */
          // eslint-disable-next-line react-hooks/purity
          restante: cierraEn.getTime() - Date.now(),
          texto: formatArtDayTime(cierraEn),
        }
      : null;

  const cerrada = ventaCerrada();

  // Pie de foto para Instagram. Sale de los mismos datos que la pagina,
  // para que no terminen diciendo cosas distintas.
  const enlaceDifusion = `${raffleConfig.siteUrl}${RUTA_DISTRITO}`;
  const textoInstagram = [
    `Mantengamos la esperanza de un mundo libre de polio. ${GANCHO}`,
    "",
    `Bono Solidario PolioPlus del Distrito Rotary 4921.${
      ECUACION ? ` ${ECUACION}.` : ""
    } Con cada bono de ${formatArs(
      raffleConfig.ticketPriceArs
    )} colaborás con el programa PolioPlus de Rotary International, que financia campañas de vacunación para erradicar la polio.`,
    "",
    `Participás por una estadía de 5 noches para 2 personas, elegí tu destino: ${DESTINOS}, del 30 de noviembre al 4 de diciembre.`,
    "",
    `${SORTEO}.`,
    "",
    `Link en la bio 👉 ${enlaceDifusion}`,
    "",
    "#EndPolio #PolioPlus #Rotary #Distrito4921",
  ].join("\n");

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
        <div className="relative max-w-3xl w-full mx-auto px-4 pt-8 sm:pt-12 pb-16 sm:pb-20 flex flex-col items-center gap-3 sm:gap-5 text-center">
          <Image
            src="/brand/rotary-endpolio-lockup-white.png"
            alt="Rotary Distrito 4921 - End Polio Now"
            width={340}
            height={152}
            priority
            className="w-56 sm:w-[28rem] h-auto"
          />

          {/* Arriba de todo: es lo primero que tiene que ver el que entra. */}
          {cierre && (
            <CuentaRegresiva
              cierraEn={cierre.cierraEn}
              restanteInicial={cierre.restante}
              textoCierre={cierre.texto}
            />
          )}

          {/*
            El mismo orden que el volante: lema, gancho y la cuenta. Quien
            escanea el QR tiene que reconocer el papel que acaba de leer.
          */}
          <span className="uppercase tracking-wide sm:tracking-widest text-[0.7rem] sm:text-sm font-semibold text-rotary-gold">
            {MARCA}
          </span>
          {/*
            Escalonado desde el telefono: con el lema, el gancho y la cuenta
            en tamano de escritorio, el boton de comprar se iba abajo de
            todo y habia que scrollear para encontrarlo.
          */}
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight text-balance">
            {LEMA.join(" ")}
          </h1>
          <p className="text-2xl sm:text-4xl font-extrabold text-rotary-gold -mt-1">
            {GANCHO}
          </p>
          {ECUACION && (
            <p className="bg-white/15 rounded-2xl px-5 py-3 text-base sm:text-2xl font-extrabold whitespace-nowrap">
              {ECUACION}
            </p>
          )}
          {/*
            El sorteo en una linea y en letra chica: ahora el dato que
            apura es el contador, y las dos lineas que habia acá dejaban el
            boton de comprar abajo del pliegue en el telefono.
          */}
          <p className="text-sm sm:text-base text-white/75">{SORTEO}</p>

          <BotonComprar tono="sobreAzul" className="mt-4" />
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
          <p className="text-base text-rotary-ink/60 -mt-3">
            Del 30 de noviembre al 4 de diciembre de 2026
          </p>
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
          <p className="text-base text-white/90 leading-relaxed">
            Lo recaudado con este bono solidario va íntegramente al programa{" "}
            <span className="font-bold text-rotary-gold">PolioPlus</span> de Rotary
            International, que financia campañas de vacunación para Erradicar la Polio
            en el mundo. Cada número que comprás suma a ese objetivo.
          </p>

          <div className="mt-2 border-t border-white/20 pt-6 w-full flex flex-col items-center gap-2">
            {kidsSoFar > 0 ? (
              <>
                <span className="text-5xl font-extrabold text-rotary-gold">{kidsSoFar}</span>
                <span className="text-base text-white/90">
                  chico{kidsSoFar !== 1 ? "s" : ""} protegido{kidsSoFar !== 1 ? "s" : ""} contra
                  la polio gracias a este bono solidario
                </span>
              </>
            ) : (
              <span className="text-base text-white/90">
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
                  <span className="font-bold text-white">
                    {kidsGoal.toLocaleString("es-AR")}
                  </span>{" "}
                  infantes.
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

      {mostrarRanking && <RankingClubes filas={filasClubes} />}

      <section className="bg-white px-4 py-16">
        <div className="max-w-lg w-full mx-auto flex flex-col items-center gap-4 text-center">
          <p className="text-rotary-ink text-lg">
            {cerrada
              ? "La venta de bonos ya terminó. ¡Gracias a todos los que se sumaron!"
              : "Elegí tus números antes de que se agoten."}
          </p>
          <BotonComprar tono="sobreBlanco" />

          <div className="mt-8 pt-8 border-t border-rotary-ink/10 w-full flex flex-col items-center gap-3">
            <p className="text-base text-rotary-ink/70">
              Ayudanos a que llegue más lejos: compartilo con tu club.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
              <ShareWhatsAppButton mensaje={RECORDATORIO} />
              <CompartirInstagram enlace={enlaceDifusion} texto={textoInstagram} />
            </div>

            <div className="mt-4 flex flex-col items-center gap-1.5">
              <a
                href={volante}
                className="inline-flex items-center justify-center gap-2 border-2 border-rotary-azure text-rotary-azure font-bold px-6 py-3 rounded-full hover:bg-rotary-azure/10 transition-colors"
              >
                Volante para imprimir
              </a>
              <p className="text-sm text-rotary-ink/60">
                {clubVisita
                  ? `Una hoja A4 con el código QR de ${clubVisita}: lo que se venda por ahí le suma al club.`
                  : "Una hoja A4 con el código QR del distrito. Si sos de un club, entrá por el link de tu club y descargá el de ustedes."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
