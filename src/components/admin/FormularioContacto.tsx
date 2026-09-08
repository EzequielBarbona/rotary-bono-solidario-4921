"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContactoClub } from "@/lib/difusion";

/** Los tres que trae el padrón, sugeridos pero no obligatorios. */
const CARGOS_SUGERIDOS = ["Presidente", "Secretario", "Tesorero"];
const PERIODO_ACTUAL = "2026-2027";

/**
 * Alta y edición de una autoridad, a mano.
 *
 * El cargo es texto libre con sugerencias y no una lista cerrada: los
 * clubes tienen macero, presidente electo y cargos que el padrón no trae,
 * y una lista cerrada obliga a inventar dónde meterlos.
 */
export function FormularioContacto({
  club,
  contacto,
  onListo,
}: {
  club: string;
  /** Si viene, se edita; si no, se crea uno nuevo. */
  contacto?: ContactoClub;
  onListo: () => void;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState(contacto?.nombre ?? "");
  const [cargo, setCargo] = useState(contacto?.cargo ?? "");
  const [periodo, setPeriodo] = useState(contacto?.periodo ?? PERIODO_ACTUAL);
  const [telefono, setTelefono] = useState(contacto?.telefono ?? "");
  const [email, setEmail] = useState(contacto?.email ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: contacto ? "editar" : "crear",
          id: contacto?.id,
          club,
          nombre,
          cargo,
          periodo,
          telefono,
          email,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "No se pudo guardar.");
        return;
      }
      router.refresh();
      onListo();
    } catch {
      setError("Error de conexión. Probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  const campo =
    "border border-rotary-ink/15 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-azure";

  return (
    <form
      onSubmit={guardar}
      className="mt-2 border border-rotary-azure/25 bg-rotary-azure/5 rounded-lg p-3 flex flex-col gap-2"
    >
      <p className="text-xs font-bold text-rotary-ink">
        {contacto ? `Editar a ${contacto.nombre}` : `Agregar una autoridad a ${club}`}
      </p>

      <div className="grid sm:grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-rotary-ink/70">Nombre y apellido</span>
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={campo}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-rotary-ink/70">Cargo</span>
          <input
            required
            list="cargos-sugeridos"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            placeholder="Presidente, Secretario…"
            className={campo}
          />
          <datalist id="cargos-sugeridos">
            {CARGOS_SUGERIDOS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-rotary-ink/70">Período</span>
          <input
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            placeholder={PERIODO_ACTUAL}
            className={campo}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-rotary-ink/70">Teléfono</span>
          <input
            type="tel"
            inputMode="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="2994736968"
            className={campo}
          />
        </label>

        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs text-rotary-ink/70">Correo (opcional)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={campo}
          />
        </label>
      </div>

      {error && <span className="text-xs text-red-600">{error}</span>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={guardando}
          className="text-xs font-bold text-white bg-rotary-azure rounded-full px-4 py-1.5 hover:bg-rotary-azure-dark transition-colors disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onListo}
          className="text-xs text-rotary-ink/60 hover:underline"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
