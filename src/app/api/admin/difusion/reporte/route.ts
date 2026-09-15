import ExcelJS from "exceljs";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { clubesParaDifusion } from "@/lib/difusion";
import { toWhatsAppNumber } from "@/lib/phone";

/**
 * Reporte de difusion y ventas, una fila por club.
 *
 * Es el informe que se lleva al subcomite: por cada club, si hay a quien
 * escribirle, si ya se le escribio y cuanto vendio. Sale de los mismos
 * datos y con los mismos criterios que el panel de Difusion, para que el
 * papel y la pantalla no den numeros distintos.
 *
 * Los totales van como formulas y no como numeros fijos: si alguien
 * corrige una fila a mano en el Excel, el total acompaña.
 */

// Cambia con cada venta y cada aviso: nunca cacheado.
export const dynamic = "force-dynamic";

const FUENTE = { name: "Arial", size: 10 };
const AZUL = "FF0067C8";
const VERDE_CLARO = "FFE3F4EA";
const ROJO_CLARO = "FFFBE4E4";

function fechaArt(d: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(d);
}

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return new Response("No autorizado.", { status: 401 });
  }

  const clubes = await clubesParaDifusion();

  const libro = new ExcelJS.Workbook();
  libro.creator = "Bono Solidario PolioPlus - Distrito 4921";
  libro.created = new Date();

  const hoja = libro.addWorksheet("Reporte por club");
  hoja.columns = [
    { header: "Club", key: "club", width: 44 },
    { header: "Teléfono funcional registrado", key: "telefono", width: 29 },
    { header: "Notificado por WhatsApp", key: "notificado", width: 25 },
    { header: "Bonos vendidos", key: "bonos", width: 16 },
  ];

  let conTelefono = 0;
  let notificados = 0;
  let bonos = 0;

  for (const c of clubes) {
    // Mismo criterio que el boton de WhatsApp de cada contacto: si el
    // numero no arma un link, para este reporte no hay telefono.
    const telefono = c.contactos.some((k) => toWhatsAppNumber(k.telefono ?? ""));
    const notificado = c.contactos.some((k) => k.avisadoAt);
    if (telefono) conTelefono++;
    if (notificado) notificados++;
    bonos += c.bonos;

    hoja.addRow({
      club: c.club,
      telefono: telefono ? "Sí" : "No",
      notificado: notificado ? "Sí" : "No",
      bonos: c.bonos,
    });
  }

  const primera = 2;
  const ultima = clubes.length + 1;

  const total = hoja.addRow({ club: "Total" });
  // El resultado va cacheado junto a la formula: sin el, los visores que
  // no recalculan (la vista previa de WhatsApp o de Drive) muestran vacio.
  total.getCell("telefono").value = {
    formula: `COUNTIF(B${primera}:B${ultima},"Sí")`,
    result: conTelefono,
  };
  total.getCell("notificado").value = {
    formula: `COUNTIF(C${primera}:C${ultima},"Sí")`,
    result: notificados,
  };
  total.getCell("bonos").value = {
    formula: `SUM(D${primera}:D${ultima})`,
    result: bonos,
  };

  // ---------- Formato ----------
  hoja.eachRow((fila) => {
    fila.eachCell({ includeEmpty: true }, (celda) => {
      celda.font = { ...FUENTE };
    });
  });

  const encabezado = hoja.getRow(1);
  encabezado.height = 20;
  encabezado.eachCell((celda) => {
    celda.font = { ...FUENTE, bold: true, color: { argb: "FFFFFFFF" } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL } };
    celda.alignment = { vertical: "middle", horizontal: "center" };
  });
  hoja.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };

  for (let n = primera; n <= ultima; n++) {
    for (const col of ["B", "C"]) {
      const celda = hoja.getCell(`${col}${n}`);
      celda.alignment = { horizontal: "center" };
      celda.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: celda.value === "Sí" ? VERDE_CLARO : ROJO_CLARO },
      };
    }
  }
  hoja.getColumn("bonos").numFmt = "#,##0";
  hoja.getColumn("bonos").alignment = { horizontal: "right" };

  total.eachCell({ includeEmpty: true }, (celda) => {
    celda.font = { ...FUENTE, bold: true };
    celda.border = { top: { style: "medium" } };
  });
  total.getCell("telefono").alignment = { horizontal: "center" };
  total.getCell("notificado").alignment = { horizontal: "center" };

  hoja.views = [{ state: "frozen", ySplit: 1 }];
  hoja.autoFilter = { from: "A1", to: `D${ultima}` };

  // ---------- Criterios, a la vista de quien lea el reporte ----------
  const notas = [
    "Criterios",
    `Generado el ${fechaArt(new Date())} con los datos del panel de Difusión.`,
    "Teléfono funcional registrado: al menos una autoridad del club tiene un teléfono con el que se puede armar un link de WhatsApp.",
    "Notificado por WhatsApp: al menos una autoridad del club está marcada como avisada en el panel de Difusión.",
    "Bonos vendidos: incluye reservas con comprobante que un administrador todavía no confirmó, igual que el resto del panel.",
    "Los bonos de compradores de otros distritos o que llegaron sin club no figuran en ninguna fila.",
    "Fila Total: las dos primeras columnas cuentan cuántos clubes tienen \"Sí\"; la última suma los bonos.",
  ];
  hoja.addRow([]);
  for (const [i, texto] of notas.entries()) {
    const fila = hoja.addRow([texto]);
    fila.getCell(1).font = { ...FUENTE, bold: i === 0, color: { argb: i === 0 ? "FF393A4A" : "FF6B6E7A" } };
  }

  const buffer = await libro.xlsx.writeBuffer();
  const hoy = fechaArt(new Date()).replace(/\//g, "-");

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reporte-clubes-difusion-${hoy}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
