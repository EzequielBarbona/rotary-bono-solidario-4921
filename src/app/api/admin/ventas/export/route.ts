import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { ART_WEEK_MS, formatArtDayMonth, startOfArtWeek } from "@/lib/dates";
import { esGrupoAgrupado, rankingPorClub } from "@/lib/ranking";

/**
 * Descarga el padron completo de ventas en Excel.
 *
 * Es la copia que le queda al subcomite fuera de este sitio: no depende
 * de que sigan existiendo las cuentas de Vercel, Neon o GitHub. Los
 * comprobantes de transferencia son imagenes y no entran acá; siguen
 * viviendo solo en la base.
 */

// Se arma con los datos del momento, nunca cacheado.
export const dynamic = "force-dynamic";

const ART_OFFSET_MS = -3 * 60 * 60 * 1000;

/** Fecha y hora argentina, en un formato que Excel entiende como texto estable. */
function fechaHoraArt(date: Date) {
  const d = new Date(date.getTime() + ART_OFFSET_MS);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${p(
    d.getUTCHours()
  )}:${p(d.getUTCMinutes())}`;
}

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return new Response("No autorizado.", { status: 401 });
  }

  const ordenes = await prisma.order.findMany({
    include: { tickets: { select: { number: true }, orderBy: { number: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  const libro = new ExcelJS.Workbook();
  libro.creator = "Bono Solidario PolioPlus - Distrito 4921";
  libro.created = new Date();

  // ---------- Hoja 1: una fila por orden ----------
  const hoja = libro.addWorksheet("Órdenes");
  hoja.columns = [
    { header: "Orden", key: "id", width: 8 },
    { header: "Fecha", key: "fecha", width: 17 },
    { header: "Estado", key: "estado", width: 12 },
    { header: "Comprador", key: "nombre", width: 26 },
    { header: "Email", key: "email", width: 28 },
    { header: "Teléfono", key: "telefono", width: 16 },
    { header: "CUIT/CUIL", key: "cuit", width: 15 },
    { header: "Club", key: "club", width: 20 },
    { header: "Bonos", key: "bonos", width: 8 },
    { header: "Números", key: "numeros", width: 30 },
    { header: "Monto", key: "monto", width: 14 },
    { header: "Aviso enviado", key: "aviso", width: 17 },
  ];

  for (const orden of ordenes) {
    hoja.addRow({
      id: orden.id,
      fecha: fechaHoraArt(orden.createdAt),
      estado: orden.status,
      nombre: orden.buyerName,
      email: orden.buyerEmail,
      telefono: orden.buyerPhone,
      cuit: orden.buyerCuit,
      club: orden.buyerClub ?? "",
      bonos: orden.ticketCount,
      numeros: orden.tickets.map((t) => t.number.toString().padStart(4, "0")).join(", "),
      monto: orden.totalAmount,
      aviso: orden.confirmationSentAt ? fechaHoraArt(orden.confirmationSentAt) : "",
    });
  }

  // ---------- Hoja 2: el mismo resumen que muestra la pantalla ----------
  const resumen = libro.addWorksheet("Por semana");
  resumen.columns = [
    { header: "Semana", key: "semana", width: 20 },
    { header: "Bonos", key: "bonos", width: 8 },
    { header: "Reservado", key: "reservado", width: 14 },
    { header: "Confirmado", key: "confirmado", width: 14 },
    { header: "Acumulado", key: "acumulado", width: 14 },
  ];

  const cobrables = ordenes.filter(
    (o) => o.status === "PENDIENTE" || o.status === "PAGADO"
  );

  if (cobrables.length > 0) {
    const porSemana = new Map<number, { bonos: number; reservado: number; confirmado: number }>();
    for (const orden of cobrables) {
      const clave = startOfArtWeek(orden.createdAt).getTime();
      const acc = porSemana.get(clave) ?? { bonos: 0, reservado: 0, confirmado: 0 };
      acc.bonos += orden.ticketCount;
      acc.reservado += orden.totalAmount;
      if (orden.status === "PAGADO") acc.confirmado += orden.totalAmount;
      porSemana.set(clave, acc);
    }

    const primera = startOfArtWeek(cobrables[0].createdAt).getTime();
    const actual = startOfArtWeek(new Date()).getTime();
    let acumulado = 0;
    for (let t = primera; t <= actual; t += ART_WEEK_MS) {
      const datos = porSemana.get(t) ?? { bonos: 0, reservado: 0, confirmado: 0 };
      acumulado += datos.reservado;
      const fin = new Date(t + ART_WEEK_MS - 1);
      resumen.addRow({
        semana: `${formatArtDayMonth(new Date(t))} al ${formatArtDayMonth(fin)}`,
        bonos: datos.bonos,
        reservado: datos.reservado,
        confirmado: datos.confirmado,
        acumulado,
      });
    }
  }

  // ---------- Hoja 3: el mismo ranking que muestra /admin/clubes ----------
  const porClub = libro.addWorksheet("Por club");
  porClub.columns = [
    { header: "Puesto", key: "puesto", width: 8 },
    { header: "Club", key: "club", width: 34 },
    { header: "Bonos", key: "bonos", width: 8 },
    { header: "Reservado", key: "reservado", width: 14 },
    { header: "Confirmado", key: "confirmado", width: 14 },
  ];

  let puesto = 0;
  for (const fila of await rankingPorClub()) {
    const grupo = esGrupoAgrupado(fila.club);
    if (!grupo) puesto += 1;
    porClub.addRow({
      puesto: grupo ? "" : puesto,
      club: fila.club,
      bonos: fila.bonos,
      reservado: fila.reservado,
      confirmado: fila.confirmado,
    });
  }

  for (const h of [hoja, resumen, porClub]) {
    h.getRow(1).font = { bold: true };
    h.views = [{ state: "frozen", ySplit: 1 }];
  }
  // Formato de moneda argentino en las columnas de plata.
  hoja.getColumn("monto").numFmt = '"$" #,##0';
  for (const key of ["reservado", "confirmado", "acumulado"]) {
    resumen.getColumn(key).numFmt = '"$" #,##0';
  }
  for (const key of ["reservado", "confirmado"]) {
    porClub.getColumn(key).numFmt = '"$" #,##0';
  }

  const buffer = await libro.xlsx.writeBuffer();
  const hoy = fechaHoraArt(new Date()).slice(0, 10).replace(/\//g, "-");

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bono-polioplus-ventas-${hoy}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
