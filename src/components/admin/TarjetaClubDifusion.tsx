"use client";

import { useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { toWhatsAppNumber } from "@/lib/phone";
import type { ClubParaDifusion, ContactoClub } from "@/lib/difusion";

/** Fecha y hora corta, para dejar constancia de cuándo se avisó. */
function fechaCorta(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Contacto({
  contacto,
  club,
  enlace,
  volante,
  bonos,
}: {
  contacto: ContactoClub;
  club: string;
  enlace: string;
  volante: string;
  bonos: number;
}) {
  const [avisadoAt, setAvisadoAt] = useState(contacto.avisadoAt);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numero = toWhatsAppNumber(contacto.telefono ?? "");

  async function alternarAvisado() {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/contacto-avisado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contacto.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo marcar.");
        return;
      }
      setAvisadoAt(data.avisadoAt);
    } catch {
      setError("Error de conexión.");
    } finally {
      setGuardando(false);
    }
  }

  function escribir() {
    // El mensaje cambia segun como venga vendiendo el club: felicitar a
    // quien vende y arrancar de cero con quien no es lo mismo.
    const saludo = contacto.nombre.split(" ")[0];
    const mensaje = [
      `Hola ${saludo}, te escribimos del Subcomité PolioPlus del Distrito 4921 por el Bono Solidario.`,
      "",
      bonos > 0
        ? `El club ${club} ya lleva ${bonos} bono${bonos === 1 ? "" : "s"} vendido${bonos === 1 ? "" : "s"}. ¡Gracias! Te pasamos el material para que puedan sumar más.`
        : `Te pasamos el material para que ${club} pueda sumarse a la venta.`,
      "",
      "Este es el link del club: quien compre un bono entrando por acá le suma a ustedes en la copa entre clubes, aunque no sea rotario.",
      `${window.location.origin}${enlace}`,
      "",
      "Y este es un volante para imprimir y pegar donde quieran. Trae el código QR del link del club, así el que lo escanea compra y les suma:",
      `${window.location.origin}${volante}`,
      "",
      "Cualquier cosa que necesiten, escribinos. ¡Gracias por darle una mano a la campaña!",
    ].join("\n");

    window.open(
      `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <li className="py-2 border-t border-rotary-ink/10 flex flex-col gap-1">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-xs font-bold uppercase tracking-wide text-rotary-azure">
          {contacto.cargo}
        </span>
        <span className="text-sm font-medium text-rotary-ink">{contacto.nombre}</span>
        {contacto.periodo && (
          <span className="text-xs text-rotary-ink/50">{contacto.periodo}</span>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap text-xs text-rotary-ink/70">
        {contacto.telefono ? (
          <span>
            {contacto.telefono}
            <CopyButton
              value={contacto.telefono}
              label={`Copiar el teléfono de ${contacto.nombre}`}
            />
          </span>
        ) : (
          <span className="text-rotary-ink/40">sin teléfono</span>
        )}
        {contacto.email && (
          <span>
            {contacto.email}
            <CopyButton
              value={contacto.email}
              label={`Copiar el correo de ${contacto.nombre}`}
            />
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={escribir}
          disabled={!numero}
          title={numero ? `Escribirle a ${contacto.nombre}` : "No tiene teléfono cargado"}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#25d366] rounded-full px-3 py-1 hover:bg-[#1eb455] transition-colors disabled:opacity-40 disabled:hover:bg-[#25d366]"
        >
          <WhatsAppIcon size={13} />
          Mandar material
        </button>

        <button
          type="button"
          onClick={alternarAvisado}
          disabled={guardando}
          className={`text-xs font-semibold rounded-full px-3 py-1 border transition-colors disabled:opacity-60 ${
            avisadoAt
              ? "border-rotary-teal/40 bg-rotary-teal/10 text-rotary-teal-dark"
              : "border-rotary-ink/20 text-rotary-ink/60 hover:bg-rotary-ink/5"
          }`}
        >
          {guardando
            ? "…"
            : avisadoAt
              ? `✓ Avisado ${fechaCorta(avisadoAt)}`
              : "Marcar avisado"}
        </button>

        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </li>
  );
}

export function TarjetaClubDifusion({
  datos,
  siteUrl,
}: {
  datos: ClubParaDifusion;
  siteUrl: string;
}) {
  const { club, contactos, bonos, chicos, puesto } = datos;
  const avisados = contactos.filter((c) => c.avisadoAt).length;

  return (
    <div className="border border-rotary-ink/10 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="text-base font-extrabold text-rotary-ink">{club}</h3>
        <span className="text-xs text-rotary-ink/50">
          {[datos.numeroRotary && `Nº ${datos.numeroRotary}`, datos.diaReunion]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap text-sm">
        {bonos > 0 ? (
          <span className="text-rotary-ink">
            <span className="font-extrabold">{bonos}</span> bono
            {bonos === 1 ? "" : "s"} ·{" "}
            <span className="font-extrabold">{chicos}</span> chico
            {chicos === 1 ? "" : "s"}
            {puesto !== null && (
              <span className="text-rotary-ink/60"> · puesto {puesto}</span>
            )}
          </span>
        ) : (
          <span className="text-rotary-gold-dark font-semibold">
            Todavía no vendió ningún bono
          </span>
        )}
        {contactos.length > 0 && (
          <span className="text-xs text-rotary-ink/50">
            {avisados} de {contactos.length} avisados
          </span>
        )}
      </div>

      {datos.emailClub && (
        <p className="text-xs text-rotary-ink/70">
          {datos.emailClub}
          <CopyButton
            value={datos.emailClub}
            label={`Copiar el correo del club ${club}`}
          />
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <CopyButton
          value={`${siteUrl}${datos.ruta}`}
          label={`Copiar el link de invitación de ${club}`}
          texto="Copiar link"
        />
        <a
          href={datos.volante}
          className="text-xs font-semibold text-rotary-azure border border-rotary-azure/40 rounded-full px-2 py-0.5 hover:bg-rotary-azure/10 transition-colors"
        >
          Volante PDF
        </a>
      </div>

      {contactos.length > 0 ? (
        <ul className="mt-1 flex flex-col">
          {contactos.map((c) => (
            <Contacto
              key={c.id}
              contacto={c}
              club={club}
              enlace={datos.ruta}
              volante={datos.volante}
              bonos={bonos}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-rotary-ink/50 border-t border-rotary-ink/10 pt-2">
          No tenemos autoridades cargadas para este club. El padrón que nos
          pasaron cubre solo los clubes rotarios.
        </p>
      )}
    </div>
  );
}
