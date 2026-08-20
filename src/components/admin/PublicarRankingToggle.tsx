"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Prende y apaga la tabla de clubes en la pagina principal.
 *
 * El estado real vive en la base, no aca: si dos administradores tienen el
 * panel abierto, el segundo ve lo que dejo el primero al recargar.
 */
export function PublicarRankingToggle({ inicial }: { inicial: boolean }) {
  const router = useRouter();
  const [visible, setVisible] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function alternar() {
    const nuevo = !visible;
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ranking-publico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: nuevo }),
      });
      if (!res.ok) throw new Error("no se pudo guardar");
      setVisible(nuevo);
      router.refresh();
    } catch {
      setError("No se pudo guardar. Probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="border border-rotary-ink/10 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-bold text-rotary-ink">
          {visible ? "Visible en la página principal" : "Solo la ve el subcomité"}
        </p>
        <p className="text-xs text-rotary-ink/60">
          {visible
            ? "Cualquiera que entre al sitio ve esta tabla, debajo del contador de chicos protegidos."
            : "La tabla no aparece en la página pública hasta que la publiques."}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={alternar}
          disabled={guardando}
          aria-pressed={visible}
          className={`text-sm font-bold px-4 py-2 rounded-full transition-colors disabled:opacity-60 ${
            visible
              ? "border border-rotary-ink/25 text-rotary-ink hover:bg-rotary-ink/5"
              : "bg-rotary-azure text-white hover:bg-rotary-azure-dark"
          }`}
        >
          {guardando ? "Guardando…" : visible ? "Ocultar del sitio" : "Mostrar en el sitio"}
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
