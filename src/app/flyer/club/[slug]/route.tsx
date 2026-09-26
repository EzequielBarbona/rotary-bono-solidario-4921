import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import QRCode from "qrcode";
import { PDFDocument } from "pdf-lib";
import { raffleConfig } from "@/lib/config";
import { clubDeSlug, slugDeClub } from "@/lib/clubs";
import {
  DESTINOS,
  ECUACION,
  GANCHO,
  LEMA,
  LLAMADO,
  MARCA,
  PREMIO,
  SORTEO,
  URGENCIA,
} from "@/lib/copy";

/*
 * Volante A4 imprimible para cada club, con el QR de su link.
 *
 * El club lo imprime y lo pega donde quiera: quien escanea el QR entra
 * por el link de ese club, asi que la venta le queda acreditada aunque el
 * que compra no sea rotario y no sepa nada de la copa.
 *
 * Se dibuja como imagen y despues se mete en un PDF de una pagina, en vez
 * de armar el PDF a mano: asi el volante es el mismo diseno que la
 * tarjeta de WhatsApp y no dos piezas que se parecen.
 */

// A4 a 200 ppp: se imprime nitido sin que el archivo pese de mas.
const ANCHO = 1654;
const ALTO = 2339;
// A4 en puntos PDF (72 ppp).
const A4_PT: [number, number] = [595.28, 841.89];

const logoData = await readFile(
  join(process.cwd(), "assets/lockup-white-og.png"),
  "base64"
);
const logoSrc = `data:image/png;base64,${logoData}`;

const [openSansRegular, openSansExtraBold] = await Promise.all([
  readFile(join(process.cwd(), "assets/opensans-400.ttf")),
  readFile(join(process.cwd(), "assets/opensans-800.ttf")),
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const club = clubDeSlug(slug);
  if (!club) {
    return new Response("No existe ese club.", { status: 404 });
  }

  const enlace = `${raffleConfig.siteUrl}/c/${slugDeClub(club)}`;
  // Correccion alta: el volante se imprime y se ensucia, y un QR con
  // margen para el error sigue leyendose con una esquina manchada.
  const qr = await QRCode.toDataURL(enlace, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 760,
    color: { dark: "#17458f", light: "#ffffff" },
  });

  const imagen = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          // Centrado: alineado arriba quedaba un cuarto de hoja vacio abajo.
          justifyContent: "center",
          textAlign: "center",
          padding: "70px 80px",
          backgroundImage: "linear-gradient(135deg, #0067c8 0%, #17458f 100%)",
          color: "white",
          fontFamily: "Open Sans",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={540} alt="" style={{ marginBottom: 66 }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: 86,
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
            marginTop: 24,
            fontSize: 100,
            fontWeight: 800,
            color: "#f7a81b",
          }}
        >
          {GANCHO}
        </div>

        {/* La cuenta, sobre una banda: es lo que se lee desde lejos. */}
        {ECUACION && (
          <div
            style={{
              display: "flex",
              marginTop: 38,
              padding: "20px 46px",
              borderRadius: 26,
              backgroundColor: "rgba(255,255,255,0.14)",
              fontSize: 62,
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
            marginTop: 38,
            fontSize: 44,
            lineHeight: 1.3,
            color: "rgba(255,255,255,0.94)",
          }}
        >
          <div style={{ fontWeight: 800 }}>{MARCA}</div>
          <div style={{ marginTop: 10 }}>{PREMIO}</div>
          <div style={{ fontWeight: 800, color: "#f7a81b" }}>{DESTINOS}</div>
          <div style={{ marginTop: 12, fontSize: 36, color: "rgba(255,255,255,0.75)" }}>
            {SORTEO}
          </div>
        </div>

        <div style={{ marginTop: 34, fontSize: 40, color: "rgba(255,255,255,0.92)" }}>
          {URGENCIA}
        </div>

        {/* El QR sobre blanco: sobre el degradado los lectores fallan. */}
        <div
          style={{
            display: "flex",
            marginTop: 56,
            padding: 26,
            backgroundColor: "white",
            borderRadius: 28,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} width={640} height={640} alt="" />
        </div>

        <div
          style={{
            marginTop: 30,
            fontSize: 52,
            fontWeight: 800,
            color: "#f7a81b",
          }}
        >
          {LLAMADO}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 24,
            fontSize: 34,
            lineHeight: 1.35,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          <div>{`Tu compra suma al club ${club}`}</div>
          <div style={{ marginTop: 8, fontSize: 30, color: "rgba(255,255,255,0.7)" }}>
            {enlace.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </div>
    ),
    {
      width: ANCHO,
      height: ALTO,
      fonts: [
        { name: "Open Sans", data: openSansRegular, weight: 400, style: "normal" },
        { name: "Open Sans", data: openSansExtraBold, weight: 800, style: "normal" },
      ],
    }
  );

  const png = await imagen.arrayBuffer();

  // En desarrollo, ?png=1 devuelve la imagen suelta: revisar como quedo el
  // volante abriendo un PDF que ademas se descarga es un suplicio, y asi
  // se ve de una en el navegador. En produccion no existe.
  if (process.env.NODE_ENV === "development" && _request.url.includes("png=1")) {
    return new Response(png, { headers: { "Content-Type": "image/png" } });
  }

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Bono Solidario PolioPlus - ${club}`);
  const pagina = pdf.addPage(A4_PT);
  const embebida = await pdf.embedPng(png);
  pagina.drawImage(embebida, { x: 0, y: 0, width: A4_PT[0], height: A4_PT[1] });

  // pdf.save() devuelve un Uint8Array; Response quiere un buffer.
  const bytes = await pdf.save();

  return new Response(bytes.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bono-polioplus-${slugDeClub(club)}.pdf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
