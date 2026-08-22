"use client";

import { use, useEffect, useState } from "react";
import { formatArs } from "@/lib/format";
import { rutaDeClub } from "@/lib/clubs";
import { ShareWhatsAppButton } from "@/components/ShareWhatsAppButton";

type OrderStatus = "PENDIENTE" | "PAGADO" | "EXPIRADO" | "CANCELADO";
type Order = {
  id: number;
  buyerName: string;
  buyerEmail: string;
  buyerClub: string | null;
  ticketCount: number;
  totalAmount: number;
  status: OrderStatus;
  tickets: { number: number }[];
};

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
      if (cancelled) return;
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setOrder(data.order);
    }

    load();
    const interval = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  if (notFound) {
    return (
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-12">
        <p className="text-base text-rotary-ink">No encontramos esa orden.</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-12">
        <p className="text-base text-rotary-ink/60">Cargando...</p>
      </main>
    );
  }

  const numbersText = order.tickets
    .map((t) => t.number.toString().padStart(4, "0"))
    .join(", ");

  const rutaClub = rutaDeClub(order.buyerClub);

  return (
    <main className="flex-1 max-w-lg w-full mx-auto px-4 py-12 flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-rotary-ink">Orden #{order.id}</h1>

      <div className="border border-rotary-ink/10 bg-rotary-azure/5 rounded-lg p-4 flex flex-col gap-2 text-rotary-ink">
        <p>
          <span className="font-semibold">Números:</span> {numbersText}
        </p>
        <p>
          <span className="font-semibold">Total:</span> {formatArs(order.totalAmount)}
        </p>
        <p>
          <span className="font-semibold">Estado:</span> {order.status}
        </p>
      </div>

      {order.status === "PENDIENTE" && (
        <div className="border border-rotary-gold/40 bg-rotary-gold/10 rounded-lg p-4 flex flex-col gap-2">
          <p className="text-base font-bold text-rotary-ink">
            Estamos verificando tu pago
          </p>
          <p className="text-sm text-rotary-ink/80">
            Recibimos tu comprobante. Cuando el subcomité confirme que llegó la
            transferencia te vamos a enviar un mensaje por WhatsApp y tu reserva
            queda confirmada.
          </p>
          <p className="text-sm text-rotary-ink/80">
            Tus números quedan reservados a tu nombre hasta que confirmemos el
            pago. No se liberan solos.
          </p>
        </div>
      )}

      {order.status === "PAGADO" && (
        <div className="border border-rotary-teal/30 bg-rotary-teal/10 rounded-lg p-4">
          <p className="text-base font-bold text-rotary-teal-dark">
            ¡Pago confirmado! Tus números ya quedaron asegurados para el
            sorteo.
          </p>
        </div>
      )}

      {order.status === "EXPIRADO" && (
        <div className="border border-red-300 bg-red-50 rounded-lg p-4">
          <p className="text-base font-bold text-red-800">
            La reserva expiró sin confirmarse el pago. Volvé a elegir tus números.
          </p>
        </div>
      )}

      {/* Acá el link deja de ser el limpio: el que comparte un comprador
          lleva el código de su club, así que todo lo que se venda por esa
          cadena le suma a ese club. Si no eligió ninguno del padrón,
          comparte el link común. */}
      {(order.status === "PENDIENTE" || order.status === "PAGADO") && (
        <div className="border-t border-rotary-ink/10 pt-6 flex flex-col items-center gap-3 text-center">
          <p className="text-base text-rotary-ink/70">
            {rutaClub
              ? `Ya sos parte. Compartilo: cada bono que se venda por tu link suma a ${order.buyerClub}.`
              : "Ya sos parte. Compartilo para que lleguemos a más chicos."}
          </p>
          <ShareWhatsAppButton ruta={rutaClub ?? "/"} />
        </div>
      )}
    </main>
  );
}
