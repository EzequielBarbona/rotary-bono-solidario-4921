import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { DISTRICT_CLUBS } from "@/lib/clubs";

/**
 * Alta, edicion y baja de autoridades de club, a mano.
 *
 * El padron que paso el distrito cubre 99 clubes y deja 12 contactos sin
 * telefono; ademas cambian las autoridades y aparecen cargos que el PDF
 * no traia. Sin esta pantalla, cada correccion dependia de que alguien
 * corriera un script.
 *
 * El telefono se guarda tal cual se escribe, sin validar: los del padron
 * vienen en media docena de formatos distintos y rechazar uno raro es
 * peor que aceptarlo. Si no se puede armar un link de WhatsApp, la
 * tarjeta muestra el boton apagado y se ve solo.
 */
function limpiar(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const t = valor.trim();
  return t ? t : null;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const op = body?.op;

  if (op === "borrar") {
    const id = Number(body?.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Contacto inválido." }, { status: 400 });
    }
    await prisma.clubContacto.deleteMany({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  const nombre = limpiar(body?.nombre);
  const cargo = limpiar(body?.cargo);
  if (!nombre) {
    return NextResponse.json({ error: "Falta el nombre." }, { status: 400 });
  }
  if (!cargo) {
    return NextResponse.json({ error: "Falta el cargo." }, { status: 400 });
  }

  const datos = {
    nombre,
    cargo,
    periodo: limpiar(body?.periodo),
    telefono: limpiar(body?.telefono),
    email: limpiar(body?.email),
  };

  if (op === "editar") {
    const id = Number(body?.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "Contacto inválido." }, { status: 400 });
    }
    const existe = await prisma.clubContacto.findUnique({ where: { id }, select: { id: true } });
    if (!existe) {
      return NextResponse.json({ error: "Contacto no encontrado." }, { status: 404 });
    }
    await prisma.clubContacto.update({ where: { id }, data: datos });
    return NextResponse.json({ ok: true });
  }

  if (op === "crear") {
    const club = limpiar(body?.club);
    if (!club || !DISTRICT_CLUBS.includes(club)) {
      return NextResponse.json({ error: "Club desconocido." }, { status: 400 });
    }
    // Los Rotaract y los satelites no vienen en el padron, asi que no
    // tienen fila en ClubDatos y la clave foranea rechazaria el contacto.
    await prisma.clubDatos.upsert({
      where: { club },
      update: {},
      create: { club },
    });
    await prisma.clubContacto.create({ data: { club, ...datos } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Operación desconocida." }, { status: 400 });
}
