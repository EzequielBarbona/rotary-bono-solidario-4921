import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { raffleConfig } from "@/lib/config";
import { RUTA_DISTRITO } from "@/lib/clubs";
import {
  DESTINOS,
  ECUACION,
  GANCHO,
  LEMA,
  MARCA,
  SORTEO_FECHA,
  SORTEO_MEDIO,
} from "@/lib/copy";

/*
 * Imagenes para publicar en Instagram.
 *
 * Instagram no tiene forma de compartir un link desde una pagina, y en el
 * pie de foto los links no son clickeables: se publica subiendo una
 * imagen. Asi que en vez de un boton de compartir, el sitio entrega la
 * pieza lista para descargar, en los dos formatos que usa la red.
 *
 * Lleva la direccion escrita en la imagen a proposito: en Instagram nadie
 * puede clickear nada, y al menos queda a la vista para tipearla.
 */

/*
 * Los cortes del lema van a mano, formato por formato: el wrap automatico
 * parte las frases en cualquier lado. Y `pregunta` es mas chica que el
 * titulo a proposito, porque "¿Ya tenés tu bono?" tiene que entrar en una
 * sola linea: partido en dos pierde todo.
 *
 * El cuadrado tiene mucho menos alto que la historia para la misma
 * cantidad de texto, asi que ahi el lema entra en dos lineas y en letra
 * mas chica; si no, la cuenta se le monta encima al gancho.
 */
const FORMATOS = {
  // Publicacion cuadrada del feed.
  post: {
    width: 1080,
    height: 1080,
    logo: 420,
    titulo: 64,
    pregunta: 80,
    pie: 34,
    lema: LEMA,
  },
  // Historia vertical.
  historia: {
    width: 1080,
    height: 1920,
    logo: 520,
    titulo: 88,
    pregunta: 88,
    pie: 40,
    lema: ["Mantengamos", "la esperanza de un", "mundo libre de polio"],
  },
} as const;

type Formato = keyof typeof FORMATOS;

const logoData = await readFile(
  join(process.cwd(), "assets/lockup-white-og.png"),
  "base64"
);
const logoSrc = `data:image/png;base64,${logoData}`;

const [openSansRegular, openSansExtraBold] = await Promise.all([
  readFile(join(process.cwd(), "assets/opensans-400.ttf")),
  readFile(join(process.cwd(), "assets/opensans-800.ttf")),
]);

const direccion = `${raffleConfig.siteUrl.replace(/^https?:\/\//, "")}${RUTA_DISTRITO}`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ formato: string }> }
) {
  const { formato } = await params;
  if (!(formato in FORMATOS)) {
    return new Response("Formato no válido. Usá 'post' o 'historia'.", {
      status: 404,
    });
  }

  const f = FORMATOS[formato as Formato];
  const esHistoria = formato === "historia";

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
          padding: esHistoria ? "120px 70px" : "60px 60px",
          backgroundImage: "linear-gradient(135deg, #0067c8 0%, #17458f 100%)",
          color: "white",
          fontFamily: "Open Sans",
        }}
      >
        {/* Los mismos anillos del hero de la home */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -160,
            width: 520,
            height: 520,
            borderRadius: 9999,
            border: "40px solid rgba(255,255,255,0.10)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -140,
            left: -130,
            width: 380,
            height: 380,
            borderRadius: 9999,
            border: "30px solid rgba(247,168,27,0.25)",
          }}
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          width={f.logo}
          alt=""
          style={{ marginBottom: esHistoria ? 80 : 48 }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: f.titulo,
            fontWeight: 800,
            lineHeight: 1.15,
          }}
        >
          {f.lema.map((linea) => (
            <div key={linea}>{linea}</div>
          ))}
        </div>

        <div
          style={{
            marginTop: esHistoria ? 44 : 26,
            fontSize: f.pregunta,
            fontWeight: 800,
            color: "#f7a81b",
            lineHeight: 1.1,
            whiteSpace: "nowrap",
          }}
        >
          {GANCHO}
        </div>

        {/*
          La cuenta, sobre una banda. Reemplaza a la linea divisoria que
          habia aca: separa igual y ademas dice algo.
        */}
        {ECUACION && (
          <div
            style={{
              display: "flex",
              marginTop: esHistoria ? 70 : 46,
              padding: esHistoria ? "18px 40px" : "14px 32px",
              borderRadius: 22,
              backgroundColor: "rgba(255,255,255,0.14)",
              fontSize: Math.round(f.pie * 1.35),
              fontWeight: 800,
            }}
          >
            {ECUACION}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: esHistoria ? 60 : 40,
            fontSize: f.pie,
            fontWeight: 400,
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.35,
          }}
        >
          <div style={{ fontWeight: 800 }}>{MARCA}</div>
          <div style={{ marginTop: 10 }}>5 noches para 2 personas,</div>
          <div>elegí tu destino:</div>
          <div style={{ fontWeight: 800, color: "#f7a81b" }}>{DESTINOS}</div>
          <div style={{ marginTop: 18 }}>{SORTEO_FECHA}</div>
          <div>{SORTEO_MEDIO}</div>
        </div>

        <div
          style={{
            marginTop: esHistoria ? 90 : 52,
            fontSize: Math.round(f.pie * 0.92),
            fontWeight: 800,
            color: "#f7a81b",
          }}
        >
          {direccion}
        </div>
      </div>
    ),
    {
      width: f.width,
      height: f.height,
      fonts: [
        { name: "Open Sans", data: openSansRegular, weight: 400, style: "normal" },
        { name: "Open Sans", data: openSansExtraBold, weight: 800, style: "normal" },
      ],
      headers: {
        // Para que el link lo baje como archivo en vez de abrirlo.
        "Content-Disposition": `attachment; filename="bono-polioplus-${formato}.png"`,
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
