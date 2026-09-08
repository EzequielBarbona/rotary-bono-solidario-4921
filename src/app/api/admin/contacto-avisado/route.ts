import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/admin-auth";

/**
 * Marca (o desmarca) que ya se le mando el material de difusion a una
 * autoridad de club.
 *
 * Es un checklist manual, igual que el aviso de pago a los compradores:
 * el mensaje se manda a mano por WhatsApp y esto solo deja constancia,
 * para que entre varios administradores no le escriban dos veces al mismo
 * presidente ni se saltee a nadie.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Contacto inválido." }, { status: 400 });
  }

  const contacto = await prisma.clubContacto.findUnique({
    where: { id },
    select: { id: true, avisadoAt: true },
  });
  if (!contacto) {
    return NextResponse.json({ error: "Contacto no encontrado." }, { status: 404 });
  }

  // Se puede desmarcar: si alguien lo apreto por error tiene que poder
  // volver atras sin pedirle nada a nadie.
  const actualizado = await prisma.clubContacto.update({
    where: { id: contacto.id },
    data: { avisadoAt: contacto.avisadoAt ? null : new Date() },
    select: { avisadoAt: true },
  });

  return NextResponse.json({
    ok: true,
    avisadoAt: actualizado.avisadoAt?.toISOString() ?? null,
  });
}
