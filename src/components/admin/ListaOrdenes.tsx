"use client";

import { useMemo, useState } from "react";
import { OrderCard } from "@/components/admin/OrderCard";

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
  comprobanteRepetidoEn: number[];
};

/** Las pendientes primero: son las que hay que confirmar. */
const PRIORIDAD_ESTADO = { PENDIENTE: 0, PAGADO: 1, EXPIRADO: 2, CANCELADO: 3 } as const;

const ORDENES = {
  estado: "Pendientes primero",
  numero: "Número de orden",
  monto: "Monto",
  club: "Club",
} as const;

type Criterio = keyof typeof ORDENES;

/**
 * Compara sin tildes ni mayusculas: quien busca escribe "gomez" y la
 * orden dice "Gómez". Si eso no encuentra nada, el buscador parece roto.
 */
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * La lista de ordenes con buscador por nombre y orden configurable.
 *
 * Filtra y ordena en el navegador y no en el servidor: son 1000 bonos
 * como maximo, entran de sobra en memoria, y asi escribir en el buscador
 * es instantaneo en vez de esperar un viaje al servidor por cada letra.
 */
export function ListaOrdenes({
  ordenes,
  drawDateLabel,
}: {
  ordenes: AdminOrder[];
  drawDateLabel: string;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [criterio, setCriterio] = useState<Criterio>("estado");
  const [invertido, setInvertido] = useState(false);

  const visibles = useMemo(() => {
    const aguja = normalizar(busqueda);
    const filtradas = aguja
      ? ordenes.filter((o) => normalizar(o.buyerName).includes(aguja))
      : ordenes;

    const ordenadas = [...filtradas].sort((a, b) => {
      switch (criterio) {
        case "numero":
          // De la mas nueva a la mas vieja, que es como se las mira.
          return b.id - a.id;
        case "monto":
          return b.totalAmount - a.totalAmount;
        case "club":
          // Las que no eligieron club van al final: no ensucian el listado
          // alfabetico de los que si.
          if (!a.buyerClub !== !b.buyerClub) return a.buyerClub ? -1 : 1;
          return (a.buyerClub ?? "").localeCompare(b.buyerClub ?? "", "es");
        default: {
          const porEstado = PRIORIDAD_ESTADO[a.status] - PRIORIDAD_ESTADO[b.status];
          if (porEstado !== 0) return porEstado;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      }
    });

    return invertido ? ordenadas.reverse() : ordenadas;
  }, [ordenes, busqueda, criterio, invertido]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre del comprador"
          aria-label="Buscar órdenes por nombre del comprador"
          className="flex-1 border border-rotary-ink/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rotary-azure"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-rotary-ink/70" htmlFor="orden-criterio">
            Ordenar por
          </label>
          <select
            id="orden-criterio"
            value={criterio}
            onChange={(e) => setCriterio(e.target.value as Criterio)}
            className="border border-rotary-ink/15 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rotary-azure"
          >
            {Object.entries(ORDENES).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setInvertido((v) => !v)}
            aria-pressed={invertido}
            title="Dar vuelta el orden"
            className={`text-sm font-semibold border rounded-lg px-3 py-2.5 transition-colors ${
              invertido
                ? "border-rotary-azure bg-rotary-azure/10 text-rotary-azure"
                : "border-rotary-ink/15 text-rotary-ink/70 hover:bg-rotary-ink/5"
            }`}
          >
            ↕ Invertir
          </button>
        </div>
      </div>

      <p className="text-xs text-rotary-ink/50 -mt-1">
        {busqueda.trim()
          ? `${visibles.length} de ${ordenes.length} órdenes coinciden con “${busqueda.trim()}”.`
          : `${ordenes.length} órdenes en total.`}
      </p>

      <div className="flex flex-col gap-4">
        {ordenes.length === 0 && (
          <p className="text-base text-rotary-ink/60">Todavía no hay órdenes.</p>
        )}
        {ordenes.length > 0 && visibles.length === 0 && (
          <p className="text-base text-rotary-ink/60">
            Ningún comprador coincide con “{busqueda.trim()}”.
          </p>
        )}
        {visibles.map((orden) => (
          <OrderCard key={orden.id} drawDateLabel={drawDateLabel} order={orden} />
        ))}
      </div>
    </div>
  );
}
