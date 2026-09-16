import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DISTRICT_CLUBS } from "@/lib/clubs";

/**
 * Recibe el padrón de socios de un club tal como lo devuelve My Rotary.
 *
 * Lo llama la pestaña de My Rotary abierta con la sesión del admin, club
 * por club, apenas trae cada padrón: así los datos van directo a la base
 * sin pasar a mano por ningún archivo intermedio.
 *
 * El pedido llega como texto plano y con la clave adentro del cuerpo, y
 * no como JSON con encabezado de admin, porque viene desde otro dominio:
 * un encabezado propio haría que el navegador pida permiso antes y lo
 * corte. La clave es la misma del panel.
 */

type SocioEntrante = {
  rotaryId?: string;
  nombre?: string;
  onlineId?: string | null;
  email?: string | null;
  telefono?: string | null;
  rol?: string | null;
};

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const CLUB_POR_NORMA = new Map(DISTRICT_CLUBS.map((c) => [normalizar(c), c]));

/**
 * My Rotary no escribe el sufijo "(Rotaract)": lo distingue por el tipo.
 * Hay que volver a pegarlo, porque 14 localidades tienen club rotario y
 * Rotaract con el mismo nombre.
 */
function clubDelSitio(nombre: string, tipo: string) {
  if (tipo === "Rotaract Club") {
    return CLUB_POR_NORMA.get(normalizar(`${nombre} (Rotaract)`)) ?? null;
  }
  return CLUB_POR_NORMA.get(normalizar(nombre)) ?? null;
}

const limpio = (v: unknown) => {
  const t = typeof v === "string" ? v.trim() : "";
  return t ? t : null;
};

export async function POST(request: Request) {
  let cuerpo: {
    secreto?: string;
    clubMyRotary?: string;
    tipo?: string;
    socios?: SocioEntrante[];
  };
  try {
    cuerpo = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  if (!process.env.ADMIN_SECRET || cuerpo.secreto !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const club = clubDelSitio(cuerpo.clubMyRotary ?? "", cuerpo.tipo ?? "");
  if (!club) {
    // La respuesta no la puede leer quien llama (viene de otro dominio):
    // el aviso queda en el log del servidor para revisarlo después.
    console.log(`[socios] club sin pareja: "${cuerpo.clubMyRotary}" (${cuerpo.tipo})`);
    return NextResponse.json({ error: "Club desconocido." }, { status: 400 });
  }

  await prisma.clubDatos.upsert({ where: { club }, update: {}, create: { club } });

  let cargados = 0;
  for (const s of cuerpo.socios ?? []) {
    const nombre = limpio(s.nombre);
    const rotaryId = limpio(s.rotaryId);
    if (!nombre || !rotaryId) continue;

    const email = limpio(s.email);
    const telefono = limpio(s.telefono);

    await prisma.clubSocio.upsert({
      where: { rotaryId },
      create: {
        club,
        nombre,
        rotaryId,
        onlineId: limpio(s.onlineId),
        rol: limpio(s.rol),
        email,
        telefono,
      },
      // Una recarga del padrón no pisa lo que ya se completó cruzando con
      // las órdenes: correo y teléfono solo se actualizan si My Rotary
      // trae un valor.
      update: {
        club,
        nombre,
        onlineId: limpio(s.onlineId),
        rol: limpio(s.rol),
        ...(email ? { email } : {}),
        ...(telefono ? { telefono } : {}),
      },
    });
    cargados++;
  }

  console.log(`[socios] ${club}: ${cargados} socios`);
  return NextResponse.json({ ok: true, club, cargados });
}
