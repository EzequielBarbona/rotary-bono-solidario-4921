"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePurchase } from "@/lib/purchase-context";

type TicketStatus = "DISPONIBLE" | "RESERVADO" | "VENDIDO";
type Ticket = { number: number; status: TicketStatus };

const POLL_INTERVAL_MS = 20_000;

export function TicketGrid({ totalTickets }: { totalTickets: number }) {
  const router = useRouter();
  const { quantity, selectedNumbers: savedSelection, setSelectedNumbers } = usePurchase();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set(savedSelection));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quantity) {
      router.replace("/comprar/cantidad");
    }
  }, [quantity, router]);

  const loadTickets = useCallback(async () => {
    const res = await fetch("/api/tickets", { cache: "no-store" });
    const data = await res.json();
    const fresh: Ticket[] = data.tickets;
    setTickets(fresh);

    setSelected((prev) => {
      const stillAvailable = new Set(
        fresh.filter((t) => t.status === "DISPONIBLE").map((t) => t.number)
      );
      const next = new Set([...prev].filter((n) => stillAvailable.has(n)));
      if (next.size !== prev.size) {
        setError("Algunos números que habías elegido ya no están disponibles y fueron quitados de tu selección.");
      }
      return next;
    });
  }, []);

  useEffect(() => {
    // loadTickets is async; its setState calls happen after the awaited
    // fetch resolves, not synchronously during this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTickets();
    const interval = setInterval(loadTickets, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadTickets]);

  const statusByNumber = useMemo(() => {
    const map = new Map<number, TicketStatus>();
    tickets?.forEach((t) => map.set(t.number, t.status));
    return map;
  }, [tickets]);

  function toggleNumber(n: number) {
    const status = statusByNumber.get(n);
    if (status !== "DISPONIBLE") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) {
        next.delete(n);
      } else {
        if (quantity && next.size >= quantity) return prev;
        next.add(n);
      }
      return next;
    });
  }

  function handleContinue() {
    setSelectedNumbers([...selected]);
    router.push("/comprar/datos");
  }

  if (!quantity) {
    return null;
  }

  if (!tickets) {
    return <p className="text-center py-12 text-rotary-ink/60">Cargando números...</p>;
  }

  const canContinue = selected.size === quantity;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4 text-sm text-rotary-ink">
          <Legend colorClass="bg-white border border-rotary-ink/20" label="Disponible" />
          <Legend colorClass="bg-rotary-gold" label="Reservado" />
          <Legend colorClass="bg-rotary-ink/30" label="Vendido" />
          <Legend colorClass="bg-rotary-azure" label="Tu selección" />
        </div>
        <p className="font-medium text-rotary-ink">
          {selected.size} de {quantity} números elegidos
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(3.2rem,1fr))] gap-1.5">
        {Array.from({ length: totalTickets }, (_, i) => i + 1).map((n) => {
          const status = statusByNumber.get(n) ?? "DISPONIBLE";
          const isSelected = selected.has(n);
          const base = "text-xs font-mono rounded py-2 transition-colors";
          let cls = base;
          if (isSelected) {
            cls += " bg-rotary-azure text-white cursor-pointer";
          } else if (status === "DISPONIBLE") {
            cls += " bg-white border border-rotary-ink/20 hover:border-rotary-azure cursor-pointer";
          } else if (status === "RESERVADO") {
            cls += " bg-rotary-gold text-rotary-ink cursor-not-allowed";
          } else {
            cls += " bg-rotary-ink/30 text-white cursor-not-allowed";
          }
          return (
            <button
              key={n}
              type="button"
              disabled={status !== "DISPONIBLE" && !isSelected}
              onClick={() => toggleNumber(n)}
              className={cls}
            >
              {n.toString().padStart(4, "0")}
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-0 bg-white border-t shadow-lg -mx-4 px-4 py-4 sm:rounded-t-xl sm:mx-0 flex items-center justify-between gap-4">
        <div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <p className="font-medium text-rotary-ink">
            {selected.size} de {quantity} números elegidos
          </p>
        </div>
        <button
          type="button"
          disabled={!canContinue}
          onClick={handleContinue}
          className="bg-rotary-azure text-white px-6 py-2.5 rounded-full font-bold hover:bg-rotary-azure-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

function Legend({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded-sm inline-block ${colorClass}`} />
      {label}
    </span>
  );
}
