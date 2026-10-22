import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ECUACION, MARCA } from "@/lib/copy";
import { CIERRE, tiempoQueFalta, ventaCerrada } from "@/lib/cierre";
import { formatArtDayTime } from "@/lib/dates";

/*
 * La tarjeta que muestran WhatsApp, Facebook e Instagram cuando alguien
 * pega el link.
 *
 * Dice poco y grande. En el chat la miniatura mide unos 96 px: a esa
 * escala una tarjeta con el lema, el premio y el sorteo es textura, no
 * texto. Quedan el apuro, la cuenta regresiva y la cuenta de las vacunas;
 * el resto esta en la pagina, a un toque de distancia.
 *
 * Cuadrada, y no el 1200x630 de manual. Probado en un chat el 22/10/2026
 * contra La Nacion y YouTube: WhatsApp de escritorio muestra TODAS las
 * vistas previas en formato compacto por mas que la imagen sea grande —la
 * de YouTube es de 480x360 y sale igual—, asi que la proporcion no decide
 * entre tarjeta grande y chica. Lo que si decide es el recorte: el
 * compacto recorta un cuadrado del centro, y de una pieza apaisada se come
 * el logo y el pie.
 */

// El lado del diseno original, sobre el que se calcula la escala.
const LADO_BASE = 1200;

const logoData = await readFile(
  join(process.cwd(), "assets/lockup-white-og.png"),
  "base64"
);
const logoSrc = `data:image/png;base64,${logoData}`;

const [openSansRegular, openSansExtraBold] = await Promise.all([
  readFile(join(process.cwd(), "assets/opensans-400.ttf")),
  readFile(join(process.cwd(), "assets/opensans-800.ttf")),
]);

export function dibujarTarjeta({ ancho, alto }: { ancho: number; alto: number }) {
  // Redondear: Satori acepta decimales pero el texto queda sucio.
  const k = (n: number) => Math.round((n * ancho) / LADO_BASE);

  const cerrada = ventaCerrada();
  const falta = cerrada ? null : tiempoQueFalta();

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
          padding: `${k(40)}px ${k(40)}px`,
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

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={k(380)} alt="" style={{ marginBottom: k(44) }} />

        <div style={{ fontSize: k(70), fontWeight: 800, color: "#f7a81b" }}>
          {cerrada ? "La venta cerró" : "Últimas horas para comprar"}
        </div>

        {/* La cuenta regresiva, que es lo que mas pesa de toda la tarjeta. */}
        {falta && (
          <div
            style={{
              // 124 y no mas: "2 días y 23 horas" es lo mas largo que puede
              // decir, y a este cuerpo entra justo en una linea.
              fontSize: k(124),
              fontWeight: 800,
              lineHeight: 1.1,
              marginTop: k(14),
            }}
          >
            {falta}
          </div>
        )}

        {CIERRE && (
          <div
            style={{
              fontSize: k(38),
              marginTop: k(falta ? 6 : 16),
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {`${cerrada ? "Cerró" : "Cierra"} el ${formatArtDayTime(CIERRE)}`}
          </div>
        )}

        {ECUACION && (
          <div
            style={{
              display: "flex",
              marginTop: k(46),
              padding: `${k(16)}px ${k(34)}px`,
              borderRadius: k(24),
              backgroundColor: "rgba(255,255,255,0.14)",
              fontSize: k(58),
              fontWeight: 800,
            }}
          >
            {ECUACION}
          </div>
        )}

        <div style={{ marginTop: k(40), fontSize: k(38), fontWeight: 800 }}>
          {MARCA}
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
