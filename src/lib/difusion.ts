import { prisma } from "@/lib/prisma";
import { DISTRICT_CLUBS, rutaDeClub, slugDeClub } from "@/lib/clubs";
import { childrenProtected } from "@/lib/impact";
import { esGrupoAgrupado, rankingPorClub } from "@/lib/ranking";

export type ContactoClub = {
  id: number;
  cargo: string;
  nombre: string;
  periodo: string | null;
  email: string | null;
  telefono: string | null;
  avisadoAt: string | null;
};

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
};

/** Los cargos se muestran en el orden en que se los busca, no alfabético. */
const ORDEN_CARGOS = ["Presidente", "Vicepresidente", "Secretario", "Tesorero"];

/**
 * Todo lo que hace falta para salir a mover un club: sus datos, sus
 * autoridades con telefono, y como viene vendiendo.
 *
 * Las ventas van al lado de los contactos a proposito: el mensaje que le
 * mandas al presidente de un club que no vendio nada no es el mismo que
 * el que le mandas a uno que va segundo.
 */
export async function clubesParaDifusion(): Promise<ClubParaDifusion[]> {
  const [datos, contactos, ranking] = await Promise.all([
    prisma.clubDatos.findMany(),
    prisma.clubContacto.findMany({ orderBy: { id: "asc" } }),
    rankingPorClub(),
  ]);

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
    });
    contactosPorClub.set(c.club, lista);
  }

  return DISTRICT_CLUBS.map((club) => {
    const d = porClub.get(club);
    const v = ventas.get(club);
    const lista = (contactosPorClub.get(club) ?? []).sort((a, b) => {
      const ia = ORDEN_CARGOS.indexOf(a.cargo);
      const ib = ORDEN_CARGOS.indexOf(b.cargo);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

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
    };
  });
}
