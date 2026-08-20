import { prisma } from "@/lib/prisma";
import { GRUPO_AMIGOS, GRUPO_OTROS, grupoDeRanking } from "@/lib/clubs";

export type FilaClub = {
  club: string;
  bonos: number;
  reservado: number;
  confirmado: number;
};

/** Los dos cajones que no son clubes del 4921 y por eso no compiten. */
export const esGrupoAgrupado = (club: string) =>
  club === GRUPO_OTROS || club === GRUPO_AMIGOS;

/**
 * Ranking de clubes segun lo vendido.
 *
 * Vive aparte porque lo miran tres lugares (el panel, la home cuando el
 * ranking esta publicado y el Excel) y no pueden dar numeros distintos.
 *
 * Cuenta lo reservado ademas de lo confirmado, igual que el resto del
 * panel: si un club vendio, vendio, aunque un admin todavia no haya
 * marcado la transferencia.
 */
export async function rankingPorClub(): Promise<FilaClub[]> {
  const ordenes = await prisma.order.findMany({
    where: { status: { in: ["PENDIENTE", "PAGADO"] } },
    select: { buyerClub: true, ticketCount: true, totalAmount: true, status: true },
  });

  const porClub = new Map<string, FilaClub>();
  for (const orden of ordenes) {
    const club = grupoDeRanking(orden.buyerClub);
    const fila = porClub.get(club) ?? { club, bonos: 0, reservado: 0, confirmado: 0 };
    fila.bonos += orden.ticketCount;
    fila.reservado += orden.totalAmount;
    if (orden.status === "PAGADO") fila.confirmado += orden.totalAmount;
    porClub.set(club, fila);
  }

  return [...porClub.values()].sort((a, b) => {
    const grupoA = esGrupoAgrupado(a.club);
    const grupoB = esGrupoAgrupado(b.club);
    if (grupoA !== grupoB) return grupoA ? 1 : -1;
    if (b.bonos !== a.bonos) return b.bonos - a.bonos;
    return a.club.localeCompare(b.club, "es");
  });
}
