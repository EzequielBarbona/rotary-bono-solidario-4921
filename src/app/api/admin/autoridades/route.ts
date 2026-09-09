import { isAdminAuthorized } from "@/lib/admin-auth";
import { clubesParaDifusion } from "@/lib/difusion";
import { pdfDeAutoridades } from "@/lib/pdf-autoridades";

/**
 * El listado de autoridades de los 121 clubes, en PDF.
 *
 * Se arma en el momento contra la base, asi que refleja cualquier
 * correccion cargada a mano un minuto antes. Es la copia que se manda
 * por mail o se lleva impresa a una reunion de distrito.
 */

// Cambia con cada contacto que se carga: nunca cacheado.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return new Response("No autorizado.", { status: 401 });
  }

  const clubes = await clubesParaDifusion();
  const pdf = await pdfDeAutoridades(clubes);

  const hoy = new Date().toISOString().slice(0, 10);
  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Autoridades clubes 4921 - ${hoy}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
