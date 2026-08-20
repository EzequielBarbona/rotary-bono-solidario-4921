import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { formatArs, formatDrawDate } from "@/lib/format";
import { raffleConfig } from "@/lib/config";
import { startOfArtDay, startOfArtWeek } from "@/lib/dates";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { OrderCard } from "@/components/admin/OrderCard";

const STATUS_PRIORITY = { PENDIENTE: 0, PAGADO: 1, EXPIRADO: 2, CANCELADO: 3 } as const;

export default async function AdminPage() {
  const authorized = await isAdminSessionActive();

  if (!authorized) {
    return <AdminLogin />;
  }

  const now = new Date();
  const todayStart = startOfArtDay(now);
  const weekStart = startOfArtWeek(now);
  // Monto reservado (pendiente + confirmado), no solo lo ya confirmado por un
  // admin: sirve para cruzar contra el resumen bancario del dia sin esperar
  // a que alguien haga clic en "Confirmar pago".
  const claimedStatus: { in: ("PENDIENTE" | "PAGADO")[] } = { in: ["PENDIENTE", "PAGADO"] };

  const [orders, ticketCounts, todayTotal, weekTotal] = await Promise.all([
    prisma.order.findMany({
      include: { tickets: { select: { number: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.ticket.groupBy({ by: ["status"], _count: true }),
    prisma.order.aggregate({
      where: { status: claimedStatus, createdAt: { gte: todayStart } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { status: claimedStatus, createdAt: { gte: weekStart } },
      _sum: { totalAmount: true },
    }),
  ]);

  const sortedOrders = [...orders].sort((a, b) => {
    const byStatus = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (byStatus !== 0) return byStatus;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const countByStatus = Object.fromEntries(
    ticketCounts.map((c) => [c.status, c._count])
  ) as Record<string, number>;
  const pendingCount = orders.filter((o) => o.status === "PENDIENTE").length;

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-rotary-ink">Panel de administración</h1>
        <LogoutButton />
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Stat label="Vendidos" value={countByStatus.VENDIDO ?? 0} />
        <Stat label="Reservados" value={countByStatus.RESERVADO ?? 0} />
        <Stat label="Disponibles" value={countByStatus.DISPONIBLE ?? 0} />
        <Stat label="Órdenes pendientes de confirmar" value={pendingCount} highlight />
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Stat label="Transferido hoy" value={formatArs(todayTotal._sum?.totalAmount ?? 0)} />
        <Stat label="Transferido esta semana" value={formatArs(weekTotal._sum?.totalAmount ?? 0)} />
      </div>
      <p className="text-xs text-rotary-ink/50 -mt-3">
        Incluye reservas todavía no confirmadas por un admin, para poder cruzarlo
        contra el resumen bancario del día. Estos dos números se mueven todo el
        tiempo:{" "}
        <Link href="/admin/ventas" className="text-rotary-azure hover:underline">
          mirá las ventas semana por semana
        </Link>{" "}
        para ver la serie cerrada.
      </p>

      <div className="flex flex-col gap-4">
        {sortedOrders.length === 0 && (
          <p className="text-base text-rotary-ink/60">Todavía no hay órdenes.</p>
        )}
        {sortedOrders.map((order) => (
          <OrderCard
            key={order.id}
            drawDateLabel={formatDrawDate(raffleConfig.drawDate)}
            order={{
              id: order.id,
              buyerName: order.buyerName,
              buyerEmail: order.buyerEmail,
              buyerPhone: order.buyerPhone,
              buyerCuit: order.buyerCuit,
              buyerClub: order.buyerClub,
              ticketCount: order.ticketCount,
              totalAmount: order.totalAmount,
              status: order.status,
              createdAt: order.createdAt.toISOString(),
              confirmationSentAt: order.confirmationSentAt?.toISOString() ?? null,
              expiresAt: order.expiresAt.toISOString(),
              numbers: order.tickets.map((t) => t.number),
            }}
          />
        ))}
      </div>

      <Link
        href="/"
        className="self-center text-sm text-rotary-azure hover:underline mt-4"
      >
        ‹ Volver a la página principal
      </Link>
    </main>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`border rounded-lg px-4 py-2 ${
        highlight
          ? "border-rotary-gold/40 bg-rotary-gold/10 text-rotary-ink"
          : "border-rotary-ink/10 text-rotary-ink"
      }`}
    >
      <span className="font-extrabold">{value}</span> <span className="text-rotary-ink/70">{label}</span>
    </div>
  );
}
