"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { toWhatsAppNumber } from "@/lib/phone";
import { TarjetaClubDifusion } from "@/components/admin/TarjetaClubDifusion";
import type { ClubParaDifusion } from "@/lib/difusion";

const FILTROS = {
  todos: "Todos los clubes",
  sinAvisar: "Con alguien sin avisar",
  sinVentas: "Que no vendieron nada",
  conContactos: "Con autoridades cargadas",
} as const;

type Filtro = keyof typeof FILTROS;

/** Sin tildes ni mayúsculas: quien busca "gonzalez" tiene que encontrar "González". */
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * El sector de difusión: un tablero para salir a mover club por club.
 *
 * Busca por club y por nombre de autoridad, porque a veces te acordás del
 * presidente y no del club. Filtra y ordena en el navegador: son 121
 * clubes, entran de sobra en memoria.
 */
export function PanelDifusion({
  clubes,
  siteUrl,
  rutaDistrito,
}: {
  clubes: ClubParaDifusion[];
  siteUrl: string;
  rutaDistrito: string;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const visibles = useMemo(() => {
    const aguja = normalizar(busqueda);
    return clubes.filter((c) => {
      if (aguja) {
        const enClub = normalizar(c.club).includes(aguja);
        const enGente = c.contactos.some((k) => normalizar(k.nombre).includes(aguja));
        if (!enClub && !enGente) return false;
      }
      if (filtro === "sinAvisar") {
        return c.contactos.length > 0 && c.contactos.some((k) => !k.avisadoAt);
      }
      if (filtro === "sinVentas") return c.bonos === 0;
      if (filtro === "conContactos") return c.contactos.length > 0;
      return true;
    });
  }, [clubes, busqueda, filtro]);

  const conContactos = clubes.filter((c) => c.contactos.length > 0);
  const totalContactos = clubes.reduce((s, c) => s + c.contactos.length, 0);
  const avisados = clubes.reduce(
    (s, c) => s + c.contactos.filter((k) => k.avisadoAt).length,
    0
  );
  const vendieron = clubes.filter((c) => c.bonos > 0).length;

  // Las autoridades que salieron de My Rotary vinieron sin telefono, y a
  // esas no se les puede mandar el material por WhatsApp: contra el total
  // el avance siempre se va a ver peor de lo que es. Este es el universo
  // que realmente se puede alcanzar hoy, con el mismo criterio que usa el
  // boton de cada contacto: si toWhatsAppNumber no arma el numero, el
  // boton esta apagado y la autoridad no cuenta.
  const alcanzables = clubes.flatMap((c) =>
    c.contactos.filter((k) => toWhatsAppNumber(k.telefono ?? ""))
  );
  const avisadosConTelefono = alcanzables.filter((k) => k.avisadoAt).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-3 text-sm">
        <Dato valor={`${vendieron}/${clubes.length}`} etiqueta="clubes con ventas" />
        <Dato valor={`${avisados}/${totalContactos}`} etiqueta="autoridades avisadas" destacado={avisados < totalContactos} />
        <Dato
          valor={`${avisadosConTelefono}/${alcanzables.length}`}
          etiqueta="autoridades avisadas con teléfono"
          destacado={avisadosConTelefono < alcanzables.length}
        />
        <Dato valor={conContactos.length} etiqueta="clubes con autoridades cargadas" />
      </div>

      <div className="border border-rotary-ink/10 rounded-lg px-4 py-3 text-sm text-rotary-ink/70">
        Para la difusión general del distrito, que no acredita a ningún club:
        <CopyButton
          value={`${siteUrl}${rutaDistrito}`}
          label="Copiar el link de difusión del distrito"
          texto="Copiar link del distrito"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por club o por nombre de la autoridad"
          aria-label="Buscar club o autoridad"
          className="flex-1 border border-rotary-ink/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-azure"
        />
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as Filtro)}
          aria-label="Filtrar clubes"
          className="border border-rotary-ink/15 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rotary-azure"
        >
          {Object.entries(FILTROS).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-rotary-ink/50 -mt-2">
        {visibles.length === clubes.length
          ? `${clubes.length} clubes.`
          : `${visibles.length} de ${clubes.length} clubes.`}
      </p>

      <div className="flex flex-col gap-4">
        {visibles.length === 0 && (
          <p className="text-base text-rotary-ink/60">
            Ningún club coincide con lo que buscaste.
          </p>
        )}
        {visibles.map((c) => (
          <TarjetaClubDifusion key={c.club} datos={c} siteUrl={siteUrl} />
        ))}
      </div>
    </div>
  );
}

function Dato({
  valor,
  etiqueta,
  destacado,
}: {
  valor: string | number;
  etiqueta: string;
  destacado?: boolean;
}) {
  return (
    <div
      className={`border rounded-lg px-4 py-2 ${
        destacado
          ? "border-rotary-gold/40 bg-rotary-gold/10"
          : "border-rotary-ink/10"
      }`}
    >
      <span className="font-extrabold text-rotary-ink">{valor}</span>{" "}
      <span className="text-rotary-ink/70">{etiqueta}</span>
    </div>
  );
}
