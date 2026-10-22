import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DESTINOS, ECUACION, GANCHO, LEMA, MARCA, PREMIO, SORTEO } from "@/lib/copy";
import { CIERRE, faltanEnPalabras, ventaCerrada } from "@/lib/cierre";
import { formatArtDayTime } from "@/lib/dates";

/*
 * La tarjeta que muestran WhatsApp, Facebook e Instagram cuando alguien
 * pega el link.
 *
 * Es lo primero que ve un rotario antes de decidir si abre el sitio, y
 * abre con la causa. El premio va despues y en letra mas chica: es la
 * excusa para colaborar, no el motivo.
 *
 * El dibujo se escala a partir del alto, asi la misma pieza sirve para
 * cualquier proporcion. WhatsApp decide si muestra la tarjeta grande o la
 * miniatura al costado segun la imagen, y cual le gusta no se deduce
 * leyendo: hay que probar. Por eso esto es una funcion con medidas y no
 * un diseno fijo.
 */

// El ancho del diseno original, sobre el que se calcula la escala.
//
// Escala por ancho y no por alto a proposito: el texto va en lineas, y lo
// que decide si una linea entra o se parte es el ancho. Escalando por alto,
// una pieza cuadrada agrandaba las letras un 90% y se desbordaba todo.
const ANCHO_BASE = 1200;

const logoData = await readFile(
  join(process.cwd(), "assets/lockup-white-og.png"),
  "base64"
);
const logoSrc = `data:image/png;base64,${logoData}`;

const [openSansRegular, openSansExtraBold] = await Promise.all([
  readFile(join(process.cwd(), "assets/opensans-400.ttf")),
  readFile(join(process.cwd(), "assets/opensans-800.ttf")),
]);

export function dibujarTarjeta({
  ancho,
  alto,
  etiqueta,
  resumida = false,
}: {
  ancho: number;
  alto: number;
  /** Texto chico en una esquina, para reconocer la variante en una prueba. */
  etiqueta?: string;
  /**
   * Version para mirarse del tamaño de una uña.
   *
   * En el chat la miniatura mide unos 96 px: a esa escala la unica linea
   * que se llega a leer es la primera, y el resto es textura. Esta version
   * tira el lema, el premio y el sorteo —que estan en la pagina, a un
   * toque de distancia— y deja el gancho, la cuenta y el cierre al triple
   * de tamaño.
   */
  resumida?: boolean;
}) {
  /*
   * Una pieza casi cuadrada tiene alto de sobra y el mismo ancho, asi que
   * con la escala del apaisado queda un dibujo chico flotando en el medio.
   * Para llenarla, el lema se parte en tres lineas —mas cortas, entran mas
   * grandes— y todo crece un cuarto.
   */
  const cuadrada = alto / ancho >= 0.9;
  const lema = cuadrada
    ? ["Mantengamos", "la esperanza de un", "mundo libre de polio"]
    : LEMA;
  const premio = cuadrada
    ? [PREMIO, DESTINOS]
    : [`${PREMIO} ${DESTINOS}`];

  // Redondear: Satori acepta decimales pero el texto queda sucio.
  const k = (n: number) =>
    Math.round((n * ancho * (cuadrada ? 1.25 : 1)) / ANCHO_BASE);

  /*
   * El cierre, que es lo que apura. Las lineas salen de un arreglo y no de
   * un fragmento: Satori ve el fragmento como un solo hijo y acomoda todo
   * en fila, una al lado de la otra.
   */
  const lineasCierre = !CIERRE
    ? []
    : ventaCerrada()
      ? [{ texto: "La venta cerró", tam: 32, color: "white" }]
      : [
          { texto: "ÚLTIMAS HORAS PARA AYUDAR", tam: 24, color: "#f7a81b" },
          /*
           * La cuenta se dibuja en el momento en que WhatsApp pide la
           * imagen, asi que el que comparte el link manda el numero de
           * recien. Despues WhatsApp se guarda esa vista previa por link,
           * y por eso abajo va siempre la fecha de cierre: si el numero
           * envejece, al lado esta el dato que no se vence.
           */
          { texto: faltanEnPalabras() ?? "", tam: 38, color: "white" },
          {
            texto: `Cierra el ${formatArtDayTime(CIERRE)}`,
            tam: 24,
            color: "rgba(255,255,255,0.85)",
          },
        ].filter((l) => l.texto);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          // Poco aire arriba y abajo: la tarjeta se ve chica en el chat,
          // asi que el espacio va todo a que las letras sean grandes.
          padding: `${k(18)}px ${k(40)}px ${k(24)}px`,
          backgroundImage: "linear-gradient(135deg, #0067c8 0%, #17458f 100%)",
          color: "white",
          fontFamily: "Open Sans",
        }}
      >
        {/* Los mismos anillos decorativos que el hero de la home */}
        <div
          style={{
            position: "absolute",
            top: k(-140),
            right: k(-140),
            width: k(420),
            height: k(420),
            borderRadius: 9999,
            border: `${k(34)}px solid rgba(255,255,255,0.10)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: k(-120),
            left: k(-110),
            width: k(300),
            height: k(300),
            borderRadius: 9999,
            border: `${k(24)}px solid rgba(247,168,27,0.25)`,
          }}
        />

        {etiqueta && (
          <div
            style={{
              position: "absolute",
              top: k(10),
              left: k(16),
              fontSize: k(22),
              color: "rgba(255,255,255,0.65)",
            }}
          >
            {etiqueta}
          </div>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={k(300)} alt="" style={{ marginBottom: k(14) }} />

        {/* Los cortes de linea van a mano: dejarlos al wrap automatico
            parte las frases en cualquier lado. */}
        {!resumida && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontSize: k(62),
              fontWeight: 800,
              lineHeight: 1.12,
            }}
          >
            {lema.map((linea) => (
              <div key={linea}>{linea}</div>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: k(10),
            fontSize: k(resumida ? 118 : 72),
            fontWeight: 800,
            color: "#f7a81b",
            lineHeight: 1.1,
          }}
        >
          {/* Partido en dos: a este cuerpo, en una sola linea no entra. */}
          {(resumida ? ["¿Ya tenés", "tu bono?"] : [GANCHO]).map((linea) => (
            <div key={linea}>{linea}</div>
          ))}
        </div>

        {/* La cuenta: en la tarjeta de WhatsApp es lo unico que se lee. */}
        {ECUACION && (
          <div
            style={{
              display: "flex",
              marginTop: k(16),
              padding: `${k(10)}px ${k(26)}px`,
              borderRadius: k(18),
              backgroundColor: "rgba(255,255,255,0.14)",
              fontSize: k(resumida ? 50 : 40),
              fontWeight: 800,
            }}
          >
            {ECUACION}
          </div>
        )}

        {/*
          El cierre, que es lo que apura.
          No va la cuenta regresiva en vivo: la imagen se dibuja cuando
          WhatsApp pide el link y despues se queda guardada en el telefono
          del que la mando, asi que un "faltan 2 dias" quedaria congelado y
          mintiendo. La fecha de cierre no se vence nunca.
        */}
        {lineasCierre.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: k(16),
              padding: `${k(8)}px ${k(26)}px ${k(10)}px`,
              borderRadius: k(18),
              backgroundColor: "rgba(247,168,27,0.18)",
            }}
          >
            {lineasCierre.map((linea) => (
              <div
                key={linea.texto}
                style={{ fontSize: k(linea.tam), fontWeight: 800, color: linea.color }}
              >
                {linea.texto}
              </div>
            ))}
          </div>
        )}

        {!resumida && (
          <div
            style={{
              marginTop: k(20),
              width: k(560),
              height: Math.max(2, k(3)),
              backgroundColor: "rgba(255,255,255,0.25)",
            }}
          />
        )}

        {/*
          Satori exige display:flex en cualquier div con mas de un hijo, asi
          que cada linea de abajo se arma como un solo string.
        */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            // Satori no hereda el textAlign del contenedor en estos
            // anidados: sin esto las lineas cortas quedan a la izquierda.
            alignItems: "center",
            marginTop: k(resumida ? 26 : 18),
            fontSize: k(30),
            fontWeight: 400,
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.25,
          }}
        >
          <div style={{ fontWeight: 800 }}>{MARCA}</div>
          {!resumida &&
            premio.map((linea) => <div key={linea}>{linea}</div>)}
          {!resumida && <div style={{ marginTop: k(12) }}>{SORTEO}</div>}
        </div>
      </div>
    ),
    {
      width: ancho,
      height: alto,
      fonts: [
        { name: "Open Sans", data: openSansRegular, weight: 400, style: "normal" },
        { name: "Open Sans", data: openSansExtraBold, weight: 800, style: "normal" },
      ],
      /*
       * Sin guardar: la tarjeta lleva la cuenta regresiva, asi que una
       * copia guardada en el CDN serviria el numero de cuando se genero.
       * Se dibuja de nuevo en cada pedido.
       */
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
    }
  );
}
