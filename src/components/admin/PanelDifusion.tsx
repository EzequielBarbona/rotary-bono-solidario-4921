"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { toWhatsAppNumber } from "@/lib/phone";
import { ChipFiltro } from "@/components/admin/ChipFiltro";
import { TarjetaClubDifusion } from "@/components/admin/TarjetaClubDifusion";
import type { ClubParaDifusion } from "@/lib/difusion";

/**
 * Las autoridades a las que hay que avisar, cada persona una sola vez. El
 * cargo repetido de alguien no se puede marcar como avisado: contarlo
 * dejaría al club "sin avisar" para siempre.
 */
function personasDe(club: ClubParaDifusion) {
  return club.contactos.filter((k) => !k.mismaPersonaQue);
}

const tieneWhatsApp = (telefono: string | null) => Boolean(toWhatsAppNumber(telefono ?? ""));

/**
 * Filtros que se combinan: prendidos varios, el club tiene que cumplir
 * todos. "Sin ventas" más "Para avisar ya" es la lista del día: clubes
 * que no arrancaron y a los que se les puede escribir ahora mismo.
 */
const FILTROS = {
  paraAvisar: {
    texto: "Para avisar ya",
    alerta: true,
    // Alguien sin avisar y con un teléfono que sirve: se puede hacer hoy.
    cumple: (c: ClubParaDifusion) =>
      personasDe(c).some((k) => !k.avisadoAt && tieneWhatsApp(k.telefono)),
  },
  sinAvisar: {
    texto: "Con alguien sin avisar",
    alerta: false,
    cumple: (c: ClubParaDifusion) => personasDe(c).some((k) => !k.avisadoAt),
  },
  sinVentas: {
    texto: "Sin ventas",
    alerta: false,
    cumple: (c: ClubParaDifusion) => c.bonos === 0,
  },
  sinTelefono: {
    texto: "Sin teléfono que sirva",
    alerta: false,
    // Hay que conseguir un número antes de poder hacer nada.
    cumple: (c: ClubParaDifusion) => !c.contactos.some((k) => tieneWhatsApp(k.telefono)),
  },
  sinAutoridades: {
    texto: "Sin autoridades cargadas",
    alerta: false,
    cumple: (c: ClubParaDifusion) => c.contactos.length === 0,
  },
} as const;

type Filtro = keyof typeof FILTROS;

const ORDENES = {
  alfabetico: "Alfabético",
  masBonos: "Más bonos vendidos",
  menosBonos: "Menos bonos vendidos",
} as const;

type Orden = keyof typeof ORDENES;

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
 * Busca por club, por nombre de autoridad y por teléfono, porque a veces
 * te acordás del presidente y no del club, o te llegó un mensaje de un
 * número. Filtra y ordena en el navegador: son 121 clubes, entran de
 * sobra en memoria.
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
  const [activos, setActivos] = useState<Set<Filtro>>(new Set());
  const [orden, setOrden] = useState<Orden>("alfabetico");

  function alternar(filtro: Filtro) {
    setActivos((previos) => {
      const siguientes = new Set(previos);
      if (siguientes.has(filtro)) siguientes.delete(filtro);
      else siguientes.add(filtro);
      return siguientes;
    });
  }

  const cantidades = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(FILTROS) as Filtro[]).map((f) => [
          f,
          clubes.filter(FILTROS[f].cumple).length,
        ])
      ) as Record<Filtro, number>,
    [clubes]
  );

  const visibles = useMemo(() => {
    const aguja = normalizar(busqueda);
    const digitos = busqueda.replace(/\D/g, "");
    // Con menos de 5 cifras un teléfono coincidiría con casi cualquiera.
    const buscaTelefono = /^[\d\s().+\-/]+$/.test(busqueda.trim()) && digitos.length >= 5;

    const filtrados = clubes.filter((c) => {
      if (aguja) {
        const enClub = normalizar(c.club).includes(aguja);
        const enGente = c.contactos.some((k) =>
          buscaTelefono
            ? (k.telefono ?? "").replace(/\D/g, "").includes(digitos)
            : normalizar(k.nombre).includes(aguja)
        );
        if (!enClub && !enGente) return false;
      }
      for (const f of activos) if (!FILTROS[f].cumple(c)) return false;
      return true;
    });

    return [...filtrados].sort((a, b) => {
      if (orden === "masBonos" && a.bonos !== b.bonos) return b.bonos - a.bonos;
      if (orden === "menosBonos" && a.bonos !== b.bonos) return a.bonos - b.bonos;
      return a.club.localeCompare(b.club, "es");
    });
  }, [clubes, busqueda, activos, orden]);

  const hayFiltros = busqueda.trim() !== "" || activos.size > 0;

  const conContactos = clubes.filter((c) => c.contactos.length > 0);
  const personas = clubes.flatMap(personasDe);
  const totalContactos = personas.length;
  const avisados = personas.filter((k) => k.avisadoAt).length;
  const vendieron = clubes.filter((c) => c.bonos > 0).length;

  // Las autoridades que salieron de My Rotary vinieron sin telefono, y a
  // esas no se les puede mandar el material por WhatsApp: contra el total
  // el avance siempre se va a ver peor de lo que es. Este es el universo
  // que realmente se puede alcanzar hoy, con el mismo criterio que usa el
  // boton de cada contacto: si toWhatsAppNumber no arma el numero, el
  // boton esta apagado y la autoridad no cuenta.
  const alcanzables = personas.filter((k) => tieneWhatsApp(k.telefono));
  const avisadosConTelefono = alcanzables.filter((k) => k.avisadoAt).length;

  const campo =
    "border border-rotary-ink/15 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rotary-azure";

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
          placeholder="Buscar por club, nombre o teléfono de la autoridad"
          aria-label="Buscar club o autoridad"
          className={`${campo} flex-1`}
        />
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value as Orden)}
          aria-label="Ordenar clubes"
          className={campo}
        >
          {Object.entries(ORDENES).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar clubes">
        {(Object.keys(FILTROS) as Filtro[]).map((f) => (
          <ChipFiltro
            key={f}
            activo={activos.has(f)}
            onClick={() => alternar(f)}
            texto={FILTROS[f].texto}
            cantidad={cantidades[f]}
            alerta={FILTROS[f].alerta}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 text-xs text-rotary-ink/50 -mt-2">
        <span>
          {hayFiltros
            ? `${visibles.length} de ${clubes.length} clubes.`
            : `${clubes.length} clubes.`}
          {activos.size > 1 && " Cumplen todos los filtros elegidos."}
        </span>
        {hayFiltros && (
          <button
            type="button"
            onClick={() => {
              setBusqueda("");
              setActivos(new Set());
            }}
            className="font-semibold text-rotary-azure hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {visibles.length === 0 && (
          <p className="text-base text-rotary-ink/60">
            Ningún club cumple la búsqueda y los filtros elegidos.
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
