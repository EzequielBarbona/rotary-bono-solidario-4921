"use client";

import { useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { toWhatsAppNumber } from "@/lib/phone";

/**
 * Lo que el subcomite le manda a cada club para que salga a vender: su
 * link, su volante imprimible con el QR, y el envio directo al delegado.
 *
 * El telefono queda guardado y bloqueado. Se carga una vez, y despues el
 * boton de mandar esta a un clic: si hubiera que tipear el numero cada
 * vez, con 121 clubes nadie lo usa dos veces.
 */
export function FilaClubDifusion({
  club,
  enlace,
  volante,
  telefonoInicial,
}: {
  club: string;
  /** Link de invitación del club, absoluto. */
  enlace: string;
  /** URL del PDF imprimible del club, absoluta. */
  volante: string;
  telefonoInicial: string;
}) {
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [editando, setEditando] = useState(!telefonoInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numero = toWhatsAppNumber(telefono);

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/club-telefono", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: enlace.split("/c/")[1], telefono }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo guardar el número.");
        return;
      }
      setEditando(false);
    } catch {
      setError("Error de conexión. Probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  function enviarPorWhatsApp() {
    const mensaje = [
      `Hola, les paso el material del Bono Solidario PolioPlus para el club ${club}.`,
      "",
      "Este es el link del club: quien compre un bono entrando por acá le suma a ustedes en la copa entre clubes del distrito, aunque no sea rotario.",
      enlace,
      "",
      "Y este es el volante para imprimir y pegar donde quieran. Trae el código QR del link del club, así el que lo escanea compra y les suma:",
      volante,
      "",
      "¡Gracias por darle una mano a la campaña!",
    ].join("\n");
    window.open(
      `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <li className="py-2 border-b border-rotary-ink/10 flex flex-col gap-1.5">
      <span className="text-sm font-medium text-rotary-ink">{club}</span>

      <div className="flex flex-wrap items-center gap-2">
        <CopyButton
          value={enlace}
          label={`Copiar el link de invitación de ${club}`}
          texto="Copiar link"
        />
        <a
          href={volante}
          className="text-xs font-semibold text-rotary-azure border border-rotary-azure/40 rounded-full px-2 py-0.5 hover:bg-rotary-azure/10 transition-colors"
        >
          Descargar volante PDF
        </a>

        <span className="flex items-center gap-1">
          <input
            type="tel"
            inputMode="tel"
            value={telefono}
            readOnly={!editando}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Cel. del delegado"
            aria-label={`Teléfono del delegado de ${club}`}
            className={`w-40 text-xs border rounded-full px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-rotary-azure ${
              editando
                ? "border-rotary-azure/40 bg-white"
                : "border-rotary-ink/15 bg-rotary-ink/5 text-rotary-ink/70"
            }`}
          />
          {editando ? (
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              title="Guardar y bloquear"
              className="text-xs font-semibold text-white bg-rotary-azure rounded-full px-2 py-1 disabled:opacity-60"
            >
              {guardando ? "…" : "Guardar"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setEditando(true)}
              title="Desbloquear para editar"
              aria-label={`Editar el teléfono de ${club}`}
              className="text-xs text-rotary-ink/60 border border-rotary-ink/15 rounded-full px-2 py-1 hover:bg-rotary-ink/5"
            >
              ✎
            </button>
          )}
        </span>

        <button
          type="button"
          onClick={enviarPorWhatsApp}
          disabled={!numero || editando}
          title={
            !numero
              ? "Cargá el celular del delegado"
              : editando
                ? "Guardá el número primero"
                : `Enviar a ${telefono}`
          }
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#25d366] rounded-full px-3 py-1 hover:bg-[#1eb455] transition-colors disabled:opacity-40 disabled:hover:bg-[#25d366]"
        >
          <WhatsAppIcon size={13} />
          Enviar al delegado
        </button>
      </div>

      {error && <span className="text-xs text-red-600">{error}</span>}
    </li>
  );
}
