import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { DISTRICT_CLUBS } from "@/lib/clubs";

/**
 * Los socios de un club, para la lista desplegable de Difusion.
 *
 * Se piden de a un club y no todos juntos a proposito: son unos 1.800
 * socios en el distrito, y mandarlos en cada carga de la pagina seria
 * repetir el error que tumbo la base en septiembre. Asi viajan solo los
 * del club que se abre.
 */

// Cambia con cada carga de padron y con cada cruce: nunca cacheado.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const club = new URL(request.url).searchParams.get("club")?.trim();
  if (!club || !DISTRICT_CLUBS.includes(club)) {
    return NextResponse.json({ error: "Club desconocido." }, { status: 400 });
  }

  const socios = await prisma.clubSocio.findMany({
    where: { club },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      onlineId: true,
      rol: true,
      origenContacto: true,
      ordenId: true,
    },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json({ socios });
}
