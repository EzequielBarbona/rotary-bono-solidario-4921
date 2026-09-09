import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ClubParaDifusion } from "@/lib/difusion";

/*
 * El listado de autoridades del distrito, en PDF.
 *
 * El padron que circula por mail es una foto de un dia: en cuanto se
 * corrige un telefono o se carga un club que faltaba, la copia impresa
 * miente. Este se arma contra la base en el momento de bajarlo, y lleva
 * la fecha arriba para que se note cuando quedo viejo.
 *
 * Incluye a proposito los clubes sin datos: la mitad del trabajo de este
 * listado es saber a quien falta buscar.
 */

const A4 = { ancho: 595.28, alto: 841.89 };
const MARGEN = 40;
const ANCHO_UTIL = A4.ancho - MARGEN * 2;
const TOPE = A4.alto - 46;
const PIE = 46;

const TINTA = rgb(0.224, 0.227, 0.29); // rotary-ink
const AZUL = rgb(0, 0.404, 0.784); // rotary-azure
const GRIS = rgb(0.55, 0.56, 0.6);
const LINEA = rgb(0.88, 0.89, 0.91);

/** Columnas de la tabla de autoridades, en puntos desde el margen. */
const COL = {
  cargo: { x: 0, ancho: 76 },
  nombre: { x: 82, ancho: 164 },
  telefono: { x: 252, ancho: 86 },
  email: { x: 344, ancho: ANCHO_UTIL - 344 },
};

/**
 * Helvetica escribe en WinAnsi y explota con cualquier caracter que no
 * entre ahi. Los nombres vienen de un PDF ajeno y de carga a mano, asi
 * que aparecen comillas curvas y guiones largos: mejor degradarlos que
 * romper la descarga entera por un apostrofe.
 */
function aWinAnsi(texto: string) {
  return texto
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^ -ÿ]/g, "");
}

function recortar(texto: string, font: PDFFont, tam: number, ancho: number) {
  const limpio = aWinAnsi(texto);
  if (font.widthOfTextAtSize(limpio, tam) <= ancho) return limpio;
  let corte = limpio;
  while (corte.length > 1 && font.widthOfTextAtSize(corte + "...", tam) > ancho) {
    corte = corte.slice(0, -1);
  }
  return corte + "...";
}

type Color = ReturnType<typeof rgb>;

type Lapiz = {
  doc: PDFDocument;
  pagina: PDFPage;
  y: number;
  regular: PDFFont;
  negrita: PDFFont;
  paginas: PDFPage[];
};

function nuevaPagina(lapiz: Lapiz) {
  lapiz.pagina = lapiz.doc.addPage([A4.ancho, A4.alto]);
  lapiz.paginas.push(lapiz.pagina);
  lapiz.y = TOPE;
}

/** Abre pagina nueva si lo que viene no entra entero abajo. */
function asegurar(lapiz: Lapiz, alto: number) {
  if (lapiz.y - alto < PIE) nuevaPagina(lapiz);
}

function escribir(
  lapiz: Lapiz,
  texto: string,
  x: number,
  opciones: { tam?: number; negrita?: boolean; color?: Color; ancho?: number } = {}
) {
  const tam = opciones.tam ?? 8.5;
  const font = opciones.negrita ? lapiz.negrita : lapiz.regular;
  const final = opciones.ancho ? recortar(texto, font, tam, opciones.ancho) : aWinAnsi(texto);
  lapiz.pagina.drawText(final, {
    x: MARGEN + x,
    y: lapiz.y,
    size: tam,
    font,
    color: opciones.color ?? TINTA,
  });
}

function fechaLarga(d: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(d);
}

export async function pdfDeAutoridades(clubes: ClubParaDifusion[]) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold);

  doc.setTitle("Autoridades de clubes - Distrito 4921 - 2026-2027");
  doc.setAuthor("Bono Solidario PolioPlus - Distrito 4921");
  doc.setCreationDate(new Date());

  const lapiz: Lapiz = {
    doc,
    pagina: doc.addPage([A4.ancho, A4.alto]),
    y: TOPE,
    regular,
    negrita,
    paginas: [],
  };
  lapiz.paginas.push(lapiz.pagina);

  const conContactos = clubes.filter((c) => c.contactos.length > 0);
  const sinContactos = clubes.filter((c) => c.contactos.length === 0);
  const total = clubes.reduce((s, c) => s + c.contactos.length, 0);
  const sinTelefono = clubes.reduce(
    (s, c) => s + c.contactos.filter((k) => !k.telefono).length,
    0
  );

  // --- Portada ---
  escribir(lapiz, "Autoridades de clubes", 0, { tam: 20, negrita: true });
  lapiz.y -= 20;
  escribir(lapiz, "Distrito 4921  -  Periodo 2026-2027", 0, { tam: 12, color: AZUL });
  lapiz.y -= 14;
  escribir(lapiz, `Listado generado el ${fechaLarga(new Date())}`, 0, { tam: 8.5, color: GRIS });
  lapiz.y -= 26;

  const resumen: [string, string][] = [
    [`${clubes.length}`, "clubes en el distrito"],
    [`${conContactos.length}`, "con autoridades cargadas"],
    [`${total}`, "autoridades en total"],
    [`${sinTelefono}`, "sin telefono"],
    [`${sinContactos.length}`, "clubes todavia sin ningun dato"],
  ];
  for (const [numero, texto] of resumen) {
    escribir(lapiz, numero, 0, { tam: 10, negrita: true, ancho: 30 });
    escribir(lapiz, texto, 34, { tam: 10, color: GRIS });
    lapiz.y -= 15;
  }

  lapiz.y -= 12;
  escribir(lapiz, "Que falta buscar", 0, { tam: 11, negrita: true });
  lapiz.y -= 13;
  escribir(
    lapiz,
    "Los datos salen del padron que paso el distrito y de la ficha de cada club en My Rotary.",
    0,
    { tam: 8.5, color: GRIS, ancho: ANCHO_UTIL }
  );
  lapiz.y -= 10;
  escribir(lapiz, "Estos clubes no tienen ninguna autoridad cargada en ninguna de las dos fuentes:", 0, {
    tam: 8.5,
    color: GRIS,
    ancho: ANCHO_UTIL,
  });
  lapiz.y -= 18;

  // Tres columnas para que la lista de pendientes no ocupe media hoja.
  const anchoCol = ANCHO_UTIL / 3;
  const porColumna = Math.ceil(sinContactos.length / 3);
  const yInicio = lapiz.y;
  let yMin = yInicio;
  for (let col = 0; col < 3; col++) {
    lapiz.y = yInicio;
    for (const club of sinContactos.slice(col * porColumna, (col + 1) * porColumna)) {
      escribir(lapiz, club.club, col * anchoCol, { tam: 8, ancho: anchoCol - 8 });
      lapiz.y -= 11;
    }
    yMin = Math.min(yMin, lapiz.y);
  }
  lapiz.y = yMin;

  // --- Un bloque por club ---
  nuevaPagina(lapiz);

  for (const club of clubes) {
    // El encabezado y la primera fila no se separan: un club cortado
    // entre dos hojas se lee como si no tuviera autoridades.
    asegurar(lapiz, 46);

    escribir(lapiz, club.club, 0, { tam: 10.5, negrita: true, ancho: 330 });
    if (club.bonos > 0) {
      const texto = `${club.bonos} bono${club.bonos === 1 ? "" : "s"}`;
      const ancho = negrita.widthOfTextAtSize(texto, 8.5);
      escribir(lapiz, texto, ANCHO_UTIL - ancho, { tam: 8.5, negrita: true, color: AZUL });
    }
    lapiz.y -= 11;

    const meta = [
      club.numeroRotary ? `Nº ${club.numeroRotary}` : null,
      club.diaReunion,
      club.emailClub,
    ]
      .filter(Boolean)
      .join("   -   ");
    if (meta) {
      escribir(lapiz, meta, 0, { tam: 7.5, color: GRIS, ancho: ANCHO_UTIL });
      lapiz.y -= 10;
    }

    lapiz.pagina.drawLine({
      start: { x: MARGEN, y: lapiz.y + 3 },
      end: { x: MARGEN + ANCHO_UTIL, y: lapiz.y + 3 },
      thickness: 0.5,
      color: LINEA,
    });
    lapiz.y -= 9;

    if (club.contactos.length === 0) {
      escribir(lapiz, "Sin autoridades cargadas", 0, { tam: 8.5, color: GRIS });
      lapiz.y -= 20;
      continue;
    }

    for (const contacto of club.contactos) {
      asegurar(lapiz, 12);
      escribir(lapiz, contacto.cargo, COL.cargo.x, {
        tam: 8.5,
        negrita: true,
        ancho: COL.cargo.ancho,
      });
      escribir(lapiz, contacto.nombre, COL.nombre.x, { tam: 8.5, ancho: COL.nombre.ancho });
      escribir(lapiz, contacto.telefono ?? "-", COL.telefono.x, {
        tam: 8.5,
        color: contacto.telefono ? TINTA : GRIS,
        ancho: COL.telefono.ancho,
      });
      escribir(lapiz, contacto.email ?? "-", COL.email.x, {
        tam: 8,
        color: contacto.email ? TINTA : GRIS,
        ancho: COL.email.ancho,
      });
      lapiz.y -= 12;
    }
    lapiz.y -= 10;
  }

  // --- Pie con numero de pagina, recien al final para saber el total ---
  const totalPaginas = lapiz.paginas.length;
  lapiz.paginas.forEach((pagina, i) => {
    const texto = aWinAnsi(
      `Distrito 4921  -  Autoridades 2026-2027  -  ${i + 1} de ${totalPaginas}`
    );
    const ancho = regular.widthOfTextAtSize(texto, 7.5);
    pagina.drawText(texto, {
      x: (A4.ancho - ancho) / 2,
      y: 26,
      size: 7.5,
      font: regular,
      color: GRIS,
    });
  });

  return doc.save();
}
