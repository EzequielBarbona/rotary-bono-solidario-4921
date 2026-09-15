"use client";

import { useMemo, useState } from "react";
import { OrderCard } from "@/components/admin/OrderCard";
import { ChipFiltro } from "@/components/admin/ChipFiltro";
import { SIN_CLUB } from "@/lib/clubs";

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

/** Vencidas y canceladas van juntas: ninguna de las dos pide nada más. */
const ESTADOS = {
  todas: "Todas",
  pendientes: "Pendientes",
  pagadas: "Pagadas",
  bajas: "Canceladas y vencidas",
} as const;

type Estado = keyof typeof ESTADOS;

function enEstado(orden: AdminOrder, estado: Estado) {
  switch (estado) {
    case "pendientes":
      return orden.status === "PENDIENTE";
    case "pagadas":
      return orden.status === "PAGADO";
    case "bajas":
      return orden.status === "CANCELADO" || orden.status === "EXPIRADO";
    default:
      return true;
  }
}

/** Pagada, pero el comprador todavía no recibió sus números por WhatsApp. */
const sinAvisarAlComprador = (o: AdminOrder) =>
  o.status === "PAGADO" && !o.confirmationSentAt;

const conComprobanteRepetido = (o: AdminOrder) => o.comprobanteRepetidoEn.length > 0;

/** Clave interna para las órdenes que no traen club; no es un valor guardado. */
const CLUB_VACIO = "__vacio__";

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

const soloDigitos = (texto: string) => texto.replace(/\D/g, "");

/**
 * Busca en todo lo que alguien tiene a mano cuando pregunta por una
 * compra: el comprador dice su nombre o su número de bono, el resumen
 * bancario muestra el CUIT, y entre admins se habla de "la orden 86".
 */
function coincide(orden: AdminOrder, consulta: string) {
  const q = consulta.trim();
  if (!q) return true;

  // "#86": número de orden, exacto.
  if (/^#\s*\d+$/.test(q)) return orden.id === Number(soloDigitos(q));

  // Solo cifras (con guiones o espacios, como se copia un CUIT o un
  // teléfono). Hasta 4 cifras es un número de orden o de bono: con menos
  // dígitos que eso, buscar dentro de CUITs y teléfonos traería casi todo.
  if (/^[\d\s().+\-/]+$/.test(q)) {
    const digitos = soloDigitos(q);
    if (digitos.length <= 4) {
      return orden.id === Number(digitos) || orden.numbers.includes(Number(digitos));
    }
    return (
      soloDigitos(orden.buyerCuit).includes(digitos) ||
      soloDigitos(orden.buyerPhone).includes(digitos)
    );
  }

  const aguja = normalizar(q);
  return [orden.buyerName, orden.buyerEmail, orden.buyerClub ?? ""].some((campo) =>
    normalizar(campo).includes(aguja)
  );
}

function etiquetaDeClub(clave: string) {
  if (clave === CLUB_VACIO) return "Sin club indicado";
  if (clave === SIN_CLUB) return "Ninguno, llegó por su cuenta";
  return clave;
}

/**
 * La lista de órdenes con buscador, filtros combinables y orden
 * configurable.
 *
 * Filtra y ordena en el navegador y no en el servidor: son 1000 bonos
 * como máximo, entran de sobra en memoria, y así cada filtro responde al
 * instante en vez de esperar un viaje al servidor.
 */
export function ListaOrdenes({
  ordenes,
  drawDateLabel,
}: {
  ordenes: AdminOrder[];
  drawDateLabel: string;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<Estado>("todas");
  const [soloSinAvisar, setSoloSinAvisar] = useState(false);
  const [soloRepetidos, setSoloRepetidos] = useState(false);
  const [club, setClub] = useState("");
  const [criterio, setCriterio] = useState<Criterio>("estado");
  const [invertido, setInvertido] = useState(false);

  const cantidades = useMemo(
    () => ({
      todas: ordenes.length,
      pendientes: ordenes.filter((o) => enEstado(o, "pendientes")).length,
      pagadas: ordenes.filter((o) => enEstado(o, "pagadas")).length,
      bajas: ordenes.filter((o) => enEstado(o, "bajas")).length,
      sinAvisar: ordenes.filter(sinAvisarAlComprador).length,
      repetidos: ordenes.filter(conComprobanteRepetido).length,
    }),
    [ordenes]
  );

  // Solo los clubes que tienen órdenes, con cuántas: una lista de los 121
  // obligaría a probar club por club para encontrar los que vendieron.
  const clubesConOrdenes = useMemo(() => {
    const cuenta = new Map<string, number>();
    for (const o of ordenes) {
      const clave = o.buyerClub || CLUB_VACIO;
      cuenta.set(clave, (cuenta.get(clave) ?? 0) + 1);
    }
    const alFinal = (clave: string) => clave === SIN_CLUB || clave === CLUB_VACIO;
    return [...cuenta.entries()].sort(([a], [b]) => {
      if (alFinal(a) !== alFinal(b)) return alFinal(a) ? 1 : -1;
      return a.localeCompare(b, "es");
    });
  }, [ordenes]);

  const visibles = useMemo(() => {
    const filtradas = ordenes.filter(
      (o) =>
        enEstado(o, estado) &&
        (!soloSinAvisar || sinAvisarAlComprador(o)) &&
        (!soloRepetidos || conComprobanteRepetido(o)) &&
        (!club || (o.buyerClub || CLUB_VACIO) === club) &&
        coincide(o, busqueda)
    );

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
  }, [ordenes, busqueda, estado, soloSinAvisar, soloRepetidos, club, criterio, invertido]);

  const hayFiltros =
    busqueda.trim() !== "" || estado !== "todas" || soloSinAvisar || soloRepetidos || club !== "";

  function limpiarFiltros() {
    setBusqueda("");
    setEstado("todas");
    setSoloSinAvisar(false);
    setSoloRepetidos(false);
    setClub("");
  }

  const campo =
    "border border-rotary-ink/15 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rotary-azure";

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre, CUIT, teléfono, email, #orden o número de bono"
        aria-label="Buscar órdenes"
        className={campo}
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
        {(Object.keys(ESTADOS) as Estado[]).map((clave) => (
          <ChipFiltro
            key={clave}
            activo={estado === clave}
            onClick={() => setEstado(clave)}
            texto={ESTADOS[clave]}
            cantidad={cantidades[clave]}
            alerta={clave === "pendientes"}
          />
        ))}
        <span className="w-px bg-rotary-ink/10 mx-1" aria-hidden />
        <ChipFiltro
          activo={soloSinAvisar}
          onClick={() => setSoloSinAvisar((v) => !v)}
          texto="Pagadas sin avisar al comprador"
          cantidad={cantidades.sinAvisar}
          alerta
        />
        <ChipFiltro
          activo={soloRepetidos}
          onClick={() => setSoloRepetidos((v) => !v)}
          texto="Comprobante repetido"
          cantidad={cantidades.repetidos}
          alerta
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <select
          value={club}
          onChange={(e) => setClub(e.target.value)}
          aria-label="Filtrar por club"
          className={`${campo} sm:flex-1`}
        >
          <option value="">Todos los clubes</option>
          {clubesConOrdenes.map(([clave, n]) => (
            <option key={clave} value={clave}>
              {etiquetaDeClub(clave)} ({n})
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-sm text-rotary-ink/70" htmlFor="orden-criterio">
            Ordenar por
          </label>
          <select
            id="orden-criterio"
            value={criterio}
            onChange={(e) => setCriterio(e.target.value as Criterio)}
            className={campo}
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

      <div className="flex items-center gap-3 text-xs text-rotary-ink/50 -mt-1">
        <span>
          {hayFiltros
            ? `${visibles.length} de ${ordenes.length} órdenes.`
            : `${ordenes.length} órdenes en total.`}
        </span>
        {hayFiltros && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="font-semibold text-rotary-azure hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {ordenes.length === 0 && (
          <p className="text-base text-rotary-ink/60">Todavía no hay órdenes.</p>
        )}
        {ordenes.length > 0 && visibles.length === 0 && (
          <p className="text-base text-rotary-ink/60">
            Ninguna orden coincide con la búsqueda y los filtros elegidos.
          </p>
        )}
        {visibles.map((orden) => (
          <OrderCard key={orden.id} drawDateLabel={drawDateLabel} order={orden} />
        ))}
      </div>
    </div>
  );
}
