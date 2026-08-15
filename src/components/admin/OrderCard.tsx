"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatArs } from "@/lib/format";

type AdminOrder = {
  id: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerCuit: string;
  buyerClub: string | null;
  ticketCount: number;
  totalAmount: number;
  status: "PENDIENTE" | "PAGADO" | "EXPIRADO" | "CANCELADO";
  createdAt: string;
  expiresAt: string;
  numbers: number[];
};

const STATUS_STYLES: Record<AdminOrder["status"], string> = {
  PENDIENTE: "bg-rotary-gold/15 text-rotary-gold-dark border-rotary-gold/40",
  PAGADO: "bg-rotary-teal/15 text-rotary-teal-dark border-rotary-teal/40",
  EXPIRADO: "bg-red-50 text-red-700 border-red-200",
  CANCELADO: "bg-rotary-ink/10 text-rotary-ink/60 border-rotary-ink/20",
};

export function OrderCard({ order }: { order: AdminOrder }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numbersText = [...order.numbers]
    .sort((a, b) => a - b)
    .map((n) => n.toString().padStart(4, "0"))
    .join(", ");

  async function handleConfirm() {
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/confirm`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo confirmar el pago.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="border border-rotary-ink/10 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
      <a
        href={`/api/orders/${order.id}/receipt`}
        target="_blank"
        rel="noreferrer"
        className="shrink-0"
      >
        {/* next/image no aporta nada aca: es una miniatura privada servida por
            una API protegida, no un asset publico que valga la pena optimizar. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/orders/${order.id}/receipt`}
          alt={`Comprobante orden #${order.id}`}
          className="w-28 h-28 object-cover rounded-lg border border-rotary-ink/10 bg-rotary-ink/5"
        />
      </a>

      <div className="flex-1 flex flex-col gap-1 text-sm text-rotary-ink">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold">Orden #{order.id}</span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[order.status]}`}
          >
            {order.status}
          </span>
        </div>
        <p>
          <span className="font-semibold">Comprador:</span> {order.buyerName}
        </p>
        <p>
          <span className="font-semibold">Email:</span> {order.buyerEmail} ·{" "}
          <span className="font-semibold">Tel:</span> {order.buyerPhone}
        </p>
        <p>
          <span className="font-semibold">CUIT/CUIL:</span> {order.buyerCuit}
        </p>
        {order.buyerClub && (
          <p>
            <span className="font-semibold">Club:</span> {order.buyerClub}
          </p>
        )}
        <p>
          <span className="font-semibold">Números:</span> {numbersText}
        </p>
        <p>
          <span className="font-semibold">Total:</span> {formatArs(order.totalAmount)}
        </p>

        {order.status === "PENDIENTE" && (
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="bg-rotary-azure text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-rotary-azure-dark disabled:opacity-50 transition-colors"
            >
              {confirming ? "Confirmando..." : "Confirmar pago"}
            </button>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
