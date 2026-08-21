import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { raffleConfig } from "@/lib/config";
import { formatArs, formatDrawDate } from "@/lib/format";
import { childrenProtected } from "@/lib/impact";

/*
 * La meta sale de la misma cuenta que el pictograma de la home, no de un
 * numero escrito a mano: si cambia el precio del bono o el tipo de
 * cambio, la tarjeta no puede quedar prometiendo otra cosa.
 */
const metaChicos = childrenProtected(
  raffleConfig.totalTickets * raffleConfig.ticketPriceArs
).toLocaleString("es-AR");

/*
 * Tarjeta que muestran WhatsApp, Facebook e Instagram cuando alguien
 * pega el link del bono. Es lo primero que ve un rotario antes de
 * decidir si abre el sitio, asi que repite el gancho principal: el
 * premio y a donde va la plata.
 */

export const alt = "Bono Solidario PolioPlus - Distrito Rotary 4921";

/*
 * 3:2 y no el 1.91:1 clasico de Facebook: WhatsApp respeta la proporcion
 * y le da mas alto a la tarjeta, que es donde este bono se comparte. El
 * contenido igual queda dentro del centro por si otra red recorta a
 * 1.91:1.
 */
export const size = { width: 1200, height: 800 };
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
          padding: "28px 40px 34px",
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
        <img src={logoSrc} width={380} alt="" style={{ marginBottom: 26 }} />

        {/*
          El causal va primero y en grande. A un rotario lo mueve la meta,
          no el premio: el premio es la excusa para que colabore, asi que
          va despues y en letra mas chica.

          Los cortes de linea van a mano; dejarlos al wrap automatico parte
          las frases en cualquier lado.
        */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontSize: 68,
            fontWeight: 800,
            lineHeight: 1.12,
          }}
        >
          <div>{`Queremos vacunar ${metaChicos}`}</div>
          <div>infantes contra la polio</div>
        </div>

        <div
          style={{
            marginTop: 14,
            fontSize: 86,
            fontWeight: 800,
            color: "#f7a81b",
            lineHeight: 1.1,
          }}
        >
          ¿Nos ayudás?
        </div>

        <div
          style={{
            marginTop: 30,
            width: 620,
            height: 3,
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
            marginTop: 26,
            fontSize: 40,
            fontWeight: 400,
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.25,
          }}
        >
          <div style={{ fontWeight: 800 }}>Bono Solidario PolioPlus</div>
          <div>Sorteamos una estadía de 5 noches para 2 personas</div>
          <div>en Bariloche o Las Grutas</div>
          <div style={{ marginTop: 12 }}>
            {`Bonos de ${formatArs(raffleConfig.ticketPriceArs)} · Sorteo ${formatDrawDate(
              raffleConfig.drawDate
            )}`}
          </div>
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
