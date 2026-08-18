import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { raffleConfig } from "@/lib/config";
import { formatArs, formatDateArs } from "@/lib/format";

/*
 * Tarjeta que muestran WhatsApp, Facebook e Instagram cuando alguien
 * pega el link del bono. Es lo primero que ve un rotario antes de
 * decidir si abre el sitio, asi que repite el gancho principal: el
 * premio y a donde va la plata.
 */

export const alt = "Bono Solidario PolioPlus - Distrito Rotary 4921";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Los assets no dependen del request, se leen una sola vez al cargar el modulo.
// Es el mismo logo del sitio pero sin el margen transparente que trae el
// original: ese margen ocupaba casi la mitad del alto y dejaba un hueco
// muerto entre el logo y el titulo.
const logoData = await readFile(
  join(process.cwd(), "assets/lockup-white-og.png"),
  "base64"
);
const logoSrc = `data:image/png;base64,${logoData}`;

const [openSansRegular, openSansExtraBold] = await Promise.all([
  readFile(join(process.cwd(), "assets/opensans-400.ttf")),
  readFile(join(process.cwd(), "assets/opensans-800.ttf")),
]);

export default async function Image() {
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
          padding: "16px 40px 26px",
          backgroundImage: "linear-gradient(135deg, #0067c8 0%, #17458f 100%)",
          color: "white",
          fontFamily: "Open Sans",
        }}
      >
        {/* Los mismos anillos decorativos que el hero de la home */}
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -140,
            width: 420,
            height: 420,
            borderRadius: 9999,
            border: "34px solid rgba(255,255,255,0.10)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -110,
            width: 300,
            height: 300,
            borderRadius: 9999,
            border: "24px solid rgba(247,168,27,0.25)",
          }}
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={560} alt="" style={{ marginBottom: 26 }} />

        <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.05 }}>
          Bono Solidario PolioPlus
        </div>

        {/*
          El corte de linea del premio va a mano: dejarlo al wrap automatico
          parte la frase en cualquier lado y se lee peor.
        */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 16,
            fontSize: 60,
            fontWeight: 800,
            color: "#f7a81b",
            lineHeight: 1.15,
          }}
        >
          <div>Estadía de 5 noches para 2 personas</div>
          <div>en Bariloche o Las Grutas</div>
        </div>

        {/*
          Satori exige display:flex en cualquier div con mas de un hijo, asi
          que la linea de abajo se arma como un solo string.
        */}
        <div
          style={{
            marginTop: 18,
            fontSize: 40,
            fontWeight: 400,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          {`Bonos de ${formatArs(raffleConfig.ticketPriceArs)} · Sorteo ${formatDateArs(
            raffleConfig.drawDate
          )}`}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Open Sans", data: openSansRegular, weight: 400, style: "normal" },
        { name: "Open Sans", data: openSansExtraBold, weight: 800, style: "normal" },
      ],
    }
  );
}
