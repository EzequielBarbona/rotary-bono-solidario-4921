"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatArs } from "@/lib/format";
import { toWhatsAppNumber } from "@/lib/phone";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

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
  confirmationSentAt: string | null;
  numbers: number[];
};

/** Fecha y hora corta, para dejar constancia de cuando se aviso. */
function formatDateTimeArs(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<AdminOrder["status"], string> = {
  PENDIENTE: "bg-rotary-gold/15 text-rotary-gold-dark border-rotary-gold/40",
  PAGADO: "bg-rotary-teal/15 text-rotary-teal-dark border-rotary-teal/40",
  EXPIRADO: "bg-red-50 text-red-700 border-red-200",
  CANCELADO: "bg-rotary-ink/10 text-rotary-ink/60 border-rotary-ink/20",
};

export function OrderCard({
  order,
  drawDateLabel,
}: {
  order: AdminOrder;
  drawDateLabel: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelText, setCancelText] = useState("");
  const [confirmationSentAt, setConfirmationSentAt] = useState(order.confirmationSentAt);
  const [markingSent, setMarkingSent] = useState(false);

  const numbersText = [...order.numbers]
    .sort((a, b) => a - b)
    .map((n) => n.toString().padStart(4, "0"))
    .join(", ");

  // Sin dominio propio no podemos mandar mails, y el canal real del
  // distrito es WhatsApp igual. Esto le deja el mensaje escrito al admin
  // para que solo tenga que apretar enviar.
  const whatsappNumber = toWhatsAppNumber(order.buyerPhone);

  function avisarPorWhatsApp() {
    const mensaje = [
      `Hola ${order.buyerName}, te confirmamos el pago del Bono Solidario PolioPlus del Distrito 4921.`,
      "",
      `Tus números: ${numbersText}`,
      `Total: ${formatArs(order.totalAmount)}`,
      "",
      `El sorteo es el ${drawDateLabel}, por la Lotería Nacional, sorteo nocturno.`,
      `Podés ver tu orden acá: ${window.location.origin}/orden/${order.id}`,
      "",
      "¡Gracias por colaborar para erradicar la polio!",
      "",
      "¿Nos das una mano para que llegue más lejos? Compartí el bono con tu gente:",
      `${window.location.origin}/`,
    ].join("\n");
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

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
      if (data?.emailSent === false) {
        setEmailWarning(
          "El pago quedó confirmado, pero no se pudo enviar el mail. Avisale vos a la persona."
        );
      }
      router.refresh();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setConfirming(false);
    }
  }

  async function toggleConfirmationSent() {
    setMarkingSent(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/notified`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo marcar el aviso.");
        return;
      }
      setConfirmationSentAt(data.confirmationSentAt);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setMarkingSent(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo dar de baja la reserva.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setCancelling(false);
    }
  }

  const canCancel = order.status === "PENDIENTE" || order.status === "PAGADO";
  const cancelConfirmed = cancelText.trim().toUpperCase() === "BAJA";

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

        {order.status === "PAGADO" && (
          <div className="mt-2 flex flex-col gap-2 items-start">
            {whatsappNumber ? (
              <button
                type="button"
                onClick={avisarPorWhatsApp}
                className="inline-flex items-center gap-2 bg-[#25d366] text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-[#1eb455] transition-colors"
              >
                <WhatsAppIcon />
                Avisar por WhatsApp
              </button>
            ) : (
              <p className="text-sm text-amber-700">
                El teléfono cargado no parece un número válido, hay que avisar a mano.
              </p>
            )}

            {/* Checklist manual: el aviso se manda a mano, esto solo deja
                constancia de que ya se hizo para no duplicarlo ni saltearlo. */}
            <button
              type="button"
              onClick={toggleConfirmationSent}
              disabled={markingSent}
              className={`inline-flex items-center gap-2 text-sm font-semibold rounded-full px-4 py-2 border-2 transition-colors disabled:opacity-50 ${
                confirmationSentAt
                  ? "border-rotary-teal bg-rotary-teal/10 text-rotary-teal-dark"
                  : "border-rotary-ink/25 text-rotary-ink/70 hover:border-rotary-ink/50"
              }`}
            >
              <span
                aria-hidden
                className={`w-4 h-4 rounded border-2 flex items-center justify-center text-[11px] leading-none ${
                  confirmationSentAt
                    ? "border-rotary-teal bg-rotary-teal text-white"
                    : "border-rotary-ink/40"
                }`}
              >
                {confirmationSentAt ? "✓" : ""}
              </span>
              {confirmationSentAt ? "Confirmación avisada" : "Marcar aviso enviado"}
            </button>
            {confirmationSentAt && (
              <p className="text-xs text-rotary-ink/50">
                Avisado el {formatDateTimeArs(confirmationSentAt)}
              </p>
            )}
          </div>
        )}

        {(order.status === "PENDIENTE" || canCancel) && (
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              {order.status === "PENDIENTE" && (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="bg-rotary-azure text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-rotary-azure-dark disabled:opacity-50 transition-colors"
                >
                  {confirming ? "Confirmando..." : "Confirmar pago"}
                </button>
              )}
              {canCancel && !showCancelConfirm && (
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-red-600 text-sm font-semibold hover:underline"
                >
                  Dar de baja reserva
                </button>
              )}
              {error && <p className="text-red-600 text-sm">{error}</p>}
              {emailWarning && (
                <p className="text-amber-700 text-sm font-medium">{emailWarning}</p>
              )}
            </div>

            {showCancelConfirm && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-3 flex flex-col gap-2">
                <p className="text-sm text-red-800">
                  Esto libera los números de esta orden para que otra persona los pueda reservar.
                  Escribí <span className="font-mono font-bold">BAJA</span> para confirmar.
                </p>
                <input
                  value={cancelText}
                  onChange={(e) => setCancelText(e.target.value)}
                  placeholder="BAJA"
                  className="border border-red-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={!cancelConfirmed || cancelling}
                    className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {cancelling ? "Dando de baja..." : "Confirmar baja"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCancelConfirm(false);
                      setCancelText("");
                    }}
                    className="text-sm text-rotary-ink/60 hover:underline"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
