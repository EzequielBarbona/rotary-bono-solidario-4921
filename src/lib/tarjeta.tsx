import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DESTINOS, ECUACION, GANCHO, LEMA, MARCA, PREMIO, SORTEO } from "@/lib/copy";

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

// Las medidas del diseno original, sobre las que se calcula la escala.
const ALTO_BASE = 630;

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
}: {
  ancho: number;
  alto: number;
  /** Texto chico en una esquina, para reconocer la variante en una prueba. */
  etiqueta?: string;
}) {
  // Redondear: Satori acepta decimales pero el texto queda sucio.
  const k = (n: number) => Math.round((n * alto) / ALTO_BASE);

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
          {LEMA.map((linea) => (
            <div key={linea}>{linea}</div>
          ))}
        </div>

        <div
          style={{
            marginTop: k(10),
            fontSize: k(72),
            fontWeight: 800,
            color: "#f7a81b",
            lineHeight: 1.1,
          }}
        >
          {GANCHO}
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
              fontSize: k(40),
              fontWeight: 800,
            }}
          >
            {ECUACION}
          </div>
        )}

        <div
          style={{
            marginTop: k(20),
            width: k(560),
            height: Math.max(2, k(3)),
            backgroundColor: "rgba(255,255,255,0.25)",
          }}
        />

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
            marginTop: k(18),
            fontSize: k(30),
            fontWeight: 400,
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.25,
          }}
        >
          <div style={{ fontWeight: 800 }}>{MARCA}</div>
          <div>{`${PREMIO} ${DESTINOS}`}</div>
          <div style={{ marginTop: k(12) }}>{SORTEO}</div>
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
    }
  );
}
