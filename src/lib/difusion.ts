import { prisma } from "@/lib/prisma";
import { DISTRICT_CLUBS, rutaDeClub, slugDeClub } from "@/lib/clubs";
import { childrenProtected } from "@/lib/impact";
import { esGrupoAgrupado, rankingPorClub } from "@/lib/ranking";
import { marcarMismaPersona, type MarcaMismaPersona } from "@/lib/misma-persona";

export type ContactoClub = {
  id: number;
  cargo: string;
  nombre: string;
  periodo: string | null;
  email: string | null;
  telefono: string | null;
  avisadoAt: string | null;
} & MarcaMismaPersona;

export type ClubParaDifusion = {
  club: string;
  numeroRotary: string | null;
  diaReunion: string | null;
  emailClub: string | null;
  /** Ruta de invitación del club, relativa. */
  ruta: string;
  /** Ruta del volante PDF, relativa. */
  volante: string;
  bonos: number;
  chicos: number;
  /** Puesto en la copa, o null si todavía no vendió. */
  puesto: number | null;
  contactos: ContactoClub[];
  /** Socios cargados desde el padrón de My Rotary. */
  socios: number;
  /** De esos, cuántos tienen teléfono o correo. */
  sociosConContacto: number;
};

/** Los cargos se muestran en el orden en que se los busca, no alfabético. */
const ORDEN_CARGOS = ["Presidente", "Vicepresidente", "Secretario", "Tesorero"];

function rangoDeCargo(cargo: string) {
  const i = ORDEN_CARGOS.indexOf(cargo);
  return i < 0 ? 99 : i;
}

/**
 * Todo lo que hace falta para salir a mover un club: sus datos, sus
 * autoridades con telefono, y como viene vendiendo.
 *
 * Las ventas van al lado de los contactos a proposito: el mensaje que le
 * mandas al presidente de un club que no vendio nada no es el mismo que
 * el que le mandas a uno que va segundo.
 */
export async function clubesParaDifusion(): Promise<ClubParaDifusion[]> {
  const [datos, contactos, ranking, socios, sociosConContacto] = await Promise.all([
    prisma.clubDatos.findMany(),
    prisma.clubContacto.findMany({ orderBy: { id: "asc" } }),
    rankingPorClub(),
    // Solo la cuenta: la lista de cada club se pide recién al abrirla, para
    // no mandar unos 1.800 socios en cada carga de la página.
    prisma.clubSocio.groupBy({ by: ["club"], _count: { _all: true } }),
    prisma.clubSocio.groupBy({
      by: ["club"],
      where: { OR: [{ email: { not: null } }, { telefono: { not: null } }] },
      _count: { _all: true },
    }),
  ]);

  const sociosPorClub = new Map(socios.map((s) => [s.club, s._count._all]));
  const contactoPorClub = new Map(sociosConContacto.map((s) => [s.club, s._count._all]));

  const porClub = new Map(datos.map((d) => [d.club, d]));
  const ventas = new Map(
    ranking.filter((f) => !esGrupoAgrupado(f.club)).map((f) => [f.club, f])
  );

  const contactosPorClub = new Map<string, ContactoClub[]>();
  for (const c of contactos) {
    const lista = contactosPorClub.get(c.club) ?? [];
    lista.push({
      id: c.id,
      cargo: c.cargo,
      nombre: c.nombre,
      periodo: c.periodo,
      email: c.email,
      telefono: c.telefono,
      avisadoAt: c.avisadoAt?.toISOString() ?? null,
      mismaPersonaQue: null,
      otrosCargos: [],
    });
    contactosPorClub.set(c.club, lista);
  }

  return DISTRICT_CLUBS.map((club) => {
    const d = porClub.get(club);
    const v = ventas.get(club);
    const lista = marcarMismaPersona(
      (contactosPorClub.get(club) ?? []).sort(
        (a, b) => rangoDeCargo(a.cargo) - rangoDeCargo(b.cargo)
      ),
      rangoDeCargo
    );

    return {
      club,
      numeroRotary: d?.numeroRotary ?? null,
      diaReunion: d?.diaReunion ?? null,
      emailClub: d?.emailClub ?? null,
      ruta: rutaDeClub(club) ?? "/",
      volante: `/flyer/club/${slugDeClub(club)}`,
      bonos: v?.bonos ?? 0,
      chicos: childrenProtected(v?.reservado ?? 0),
      puesto: v?.puesto ?? null,
      contactos: lista,
      socios: sociosPorClub.get(club) ?? 0,
      sociosConContacto: contactoPorClub.get(club) ?? 0,
    };
  });
}
