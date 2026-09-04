import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { clubDeSlug, slugDeClub } from "@/lib/clubs";
import { toWhatsAppNumber } from "@/lib/phone";
import { TEL_CLUB } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

/**
 * Guarda (o borra) el telefono del delegado de un club.
 *
 * Queda en la base y no en el navegador de quien lo cargo: el panel lo
 * usan varias personas y el telefono del delegado es del subcomite, no
 * de la computadora donde se tipeo.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const club = typeof body?.slug === "string" ? clubDeSlug(body.slug) : null;
  if (!club) {
    return NextResponse.json({ error: "Club desconocido." }, { status: 400 });
  }

  const telefono = typeof body?.telefono === "string" ? body.telefono.trim() : "";
  const clave = TEL_CLUB + slugDeClub(club);

  if (!telefono) {
    await prisma.setting.deleteMany({ where: { key: clave } });
    return NextResponse.json({ ok: true, telefono: "" });
  }

  // Se valida con el mismo normalizador que arma los links de WhatsApp:
  // guardar un numero que despues no se puede usar no sirve de nada.
  if (!toWhatsAppNumber(telefono)) {
    return NextResponse.json(
      { error: "Ese número no parece un celular argentino válido." },
      { status: 400 }
    );
  }

  await prisma.setting.upsert({
    where: { key: clave },
    update: { value: telefono },
    create: { key: clave, value: telefono },
  });
  return NextResponse.json({ ok: true, telefono });
}
