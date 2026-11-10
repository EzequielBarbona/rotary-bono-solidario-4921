import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cierreDe, ventaCerrada } from "@/lib/cierre";
import { formatArs } from "@/lib/format";
import { formatArtDayTime } from "@/lib/dates";
import type { Campania } from "@/lib/campanias";

/*
 * La tarjeta de WhatsApp de una campaña cualquiera.
 *
 * La del PolioPlus esta escrita a mano en tarjeta.tsx: lleva la cuenta
 * regresiva y la cuenta de las vacunas, que son suyas. Esta se arma con
 * lo que cualquier campaña tiene cargado —logos, premio, precio, colores—
 * para que una campaña nueva no salga a circular con la tarjeta de otra.
 *
 * Cuadrada por lo mismo que la otra: WhatsApp de escritorio recorta un
 * cuadrado del centro, y de una pieza apaisada se come el logo y el pie.
 */

const LADO_BASE = 1200;

const [openSansRegular, openSansExtraBold] = await Promise.all([
  readFile(join(process.cwd(), "assets/opensans-400.ttf")),
  readFile(join(process.cwd(), "assets/opensans-800.ttf")),
]);

/**
 * Los logos, leidos de public/ y convertidos a data URI.
 *
 * Satori no sale a buscar una URL mientras dibuja: la imagen tiene que
 * estar en la pieza. Se leen una vez al cargar el modulo y quedan.
 */
const cacheDeLogos = new Map<string, string>();

async function logoComoDato(ruta: string) {
  const guardado = cacheDeLogos.get(ruta);
  if (guardado) return guardado;
  const datos = await readFile(join(process.cwd(), "public", ruta), "base64");
  const uri = `data:image/png;base64,${datos}`;
  cacheDeLogos.set(ruta, uri);
  return uri;
}

export async function dibujarTarjetaDeCampania(
  campania: Campania,
  { ancho, alto }: { ancho: number; alto: number }
) {
  // Redondear: Satori acepta decimales pero el texto queda sucio.
  const k = (n: number) => Math.round((n * ancho) / LADO_BASE);

  const logos = await Promise.all(
    campania.instituciones.map(async (inst) => ({
      ...inst,
      src: await logoComoDato(inst.logo.replace(/^\//, "")),
    }))
  );

  const cerrada = ventaCerrada(campania);
  const cierre = cierreDe(campania);
  // Alto al que se dibuja cada logo dentro de la tarjeta blanca.
  const altoLogo = k(104);

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
          padding: `${k(56)}px ${k(48)}px`,
          backgroundImage: campania.paleta.fondo,
          color: campania.paleta.texto,
          fontFamily: "Open Sans",
        }}
      >
        {/* Los mismos anillos que el hero de la campaña. */}
        <div
          style={{
            position: "absolute",
            top: k(-150),
            right: k(-150),
            width: k(440),
            height: k(440),
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
            border: `${k(24)}px solid rgba(255,255,255,0.12)`,
          }}
        />

        {/* Los logos van sobre blanco: ninguno de los dos tiene version
            en blanco y sobre el degradado se pierden. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "white",
            borderRadius: k(28),
            padding: `${k(22)}px ${k(34)}px`,
            marginBottom: k(44),
          }}
        >
          {logos.map((inst, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={inst.logo}
              src={inst.src}
              alt=""
              height={altoLogo}
              width={Math.round((altoLogo * inst.ancho) / inst.alto)}
              style={{ marginLeft: i === 0 ? 0 : k(34) }}
            />
          ))}
        </div>

        <div
          style={{
            fontSize: k(54),
            fontWeight: 800,
            color: campania.paleta.acento,
          }}
        >
          {cerrada ? "La venta cerró" : "Bono solidario"}
        </div>

        {/* El premio es lo que decide: va en el cuerpo mas grande. */}
        <div
          style={{
            fontSize: k(86),
            fontWeight: 800,
            lineHeight: 1.12,
            marginTop: k(16),
          }}
        >
          {campania.premio}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: k(44),
            padding: `${k(18)}px ${k(38)}px`,
            borderRadius: k(26),
            backgroundColor: campania.paleta.acento,
            color: campania.paleta.acentoTexto,
            fontSize: k(62),
            fontWeight: 800,
          }}
        >
          {`${formatArs(campania.precioArs)} por número`}
        </div>

        {cierre && (
          <div
            style={{
              fontSize: k(36),
              marginTop: k(26),
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {`${cerrada ? "Cerró" : "Cierra"} el ${formatArtDayTime(cierre)}`}
          </div>
        )}

        <div style={{ marginTop: k(40), fontSize: k(36), fontWeight: 800 }}>
          {campania.instituciones.map((i) => i.nombre).join("  ·  ")}
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
       * Sin guardar: lo que dice la tarjeta depende de si la venta sigue
       * abierta, y una copia en el CDN seguiria diciendo lo de ayer.
       */
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
    }
  );
}
