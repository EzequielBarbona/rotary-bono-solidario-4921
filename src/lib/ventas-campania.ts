import { prisma } from "@/lib/prisma";
import { conLimite } from "@/lib/con-limite";

/*
 * Cuanto se vendio en una campaña.
 *
 * Lo miran la portada (una tarjeta por campaña) y la home de cada
 * campaña, asi que tiene que dar el mismo numero en las dos: si cada
 * pantalla hiciera su propia cuenta, la portada podria anunciar 664 y la
 * campaña 670.
 *
 * Cuenta lo reservado ademas de lo confirmado, igual que el panel: el
 * numero ya esta tomado y no se puede ofrecer a nadie mas.
 */

export type Vendido = { bonos: number; monto: number; ordenes: number };

export const VACIO: Vendido = { bonos: 0, monto: 0, ordenes: 0 };

export async function ventasDe(slug: string): Promise<Vendido> {
  /*
   * Con limite de tiempo: la portada es la primera pantalla que ve
   * cualquiera y no puede quedarse colgada esperando a la base. Si la
   * consulta no vuelve, la tarjeta sale sin contador —que es lo que ya
   * hace una campaña sin ventas— en vez de no salir.
   */
  const r = await conLimite(
    prisma.order.aggregate({
      where: { campania: slug, status: { in: ["PENDIENTE", "PAGADO"] } },
      _sum: { totalAmount: true, ticketCount: true },
      _count: true,
    }),
    null
  );

  if (!r) return VACIO;

  return {
    bonos: r._sum.ticketCount ?? 0,
    monto: r._sum.totalAmount ?? 0,
    ordenes: r._count,
  };
}
