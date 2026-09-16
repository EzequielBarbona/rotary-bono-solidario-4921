"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { toWhatsAppNumber } from "@/lib/phone";
import { FormularioContacto } from "@/components/admin/FormularioContacto";
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
  const router = useRouter();
  const [avisadoAt, setAvisadoAt] = useState(contacto.avisadoAt);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);

  async function borrar() {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "borrar", id: contacto.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "No se pudo borrar.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setGuardando(false);
    }
  }

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
      // Refresca para que el aviso de los otros cargos de la misma persona
      // y los contadores del panel se enteren del cambio.
      router.refresh();
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
      {contacto.otrosCargos.length > 0 && (
        <p className="text-xs text-rotary-ink/60">
          También figura como {contacto.otrosCargos.join(" y ")}.
        </p>
      )}

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
        {/* Un solo lugar para escribirle y marcar el aviso: con un botón por
            cargo, la misma persona recibía el material dos veces. */}
        {contacto.mismaPersonaQue ? (
          <span className="text-xs text-rotary-ink/80 bg-rotary-gold/10 border border-rotary-gold/40 rounded-lg px-3 py-1">
            Es la misma persona que <span className="font-semibold">{contacto.mismaPersonaQue.cargo}</span>:
            el WhatsApp y el aviso están en ese cargo
            {contacto.mismaPersonaQue.avisadoAt ? " (aviso ya marcado)" : ""}.
          </span>
        ) : (
          <>
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
          </>
        )}

        <button
          type="button"
          onClick={() => setEditando((v) => !v)}
          className="text-xs text-rotary-ink/60 border border-rotary-ink/20 rounded-full px-2 py-1 hover:bg-rotary-ink/5"
          title={`Editar los datos de ${contacto.nombre}`}
        >
          ✎ Editar
        </button>

        {/* La baja pide confirmacion: borrar un contacto se lleva puesta
            tambien la marca de avisado, y no hay como recuperarla. */}
        {confirmandoBaja ? (
          <span className="flex items-center gap-1 text-xs">
            <span className="text-rotary-ink/70">¿Seguro?</span>
            <button
              type="button"
              onClick={borrar}
              disabled={guardando}
              className="font-bold text-white bg-red-600 rounded-full px-2 py-1 disabled:opacity-60"
            >
              Sí, borrar
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoBaja(false)}
              className="text-rotary-ink/60 hover:underline"
            >
              No
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmandoBaja(true)}
            className="text-xs text-rotary-ink/50 hover:text-red-700"
            title={`Borrar a ${contacto.nombre}`}
          >
            Borrar
          </button>
        )}

        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      {editando && (
        <FormularioContacto
          club={club}
          contacto={contacto}
          onListo={() => setEditando(false)}
        />
      )}
    </li>
  );
}

type Socio = {
  id: number;
  nombre: string;
  email: string | null;
  telefono: string | null;
  onlineId: string | null;
  rol: string | null;
  origenContacto: string | null;
  ordenId: number | null;
};

/** Sin tildes ni mayúsculas, para el buscador dentro de un club grande. */
const normalizar = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * Los socios de un club, pedidos recién cuando se abre la sección.
 *
 * Se monta una sola vez y después solo se oculta: cerrar y volver a abrir
 * no repite el pedido al servidor.
 */
function ListaSocios({ club }: { club: string }) {
  const [socios, setSocios] = useState<Socio[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    let vigente = true;
    fetch(`/api/admin/socios?club=${encodeURIComponent(club)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!vigente) return;
        if (!res.ok) setError(data?.error ?? "No se pudieron traer los socios.");
        else setSocios(data.socios);
      })
      .catch(() => vigente && setError("Error de conexión."));
    return () => {
      vigente = false;
    };
  }, [club]);

  const visibles = useMemo(() => {
    const aguja = normalizar(filtro);
    if (!socios || !aguja) return socios ?? [];
    return socios.filter((s) => normalizar(s.nombre).includes(aguja));
  }, [socios, filtro]);

  if (error) return <p className="text-xs text-red-600 py-2">{error}</p>;
  if (!socios) return <p className="text-xs text-rotary-ink/50 py-2">Cargando socios…</p>;
  if (socios.length === 0) {
    return (
      <p className="text-xs text-rotary-ink/50 py-2">
        Todavía no hay socios cargados para este club.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 pt-1">
      {socios.length > 12 && (
        <input
          type="search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar socio"
          aria-label={`Buscar socio de ${club}`}
          className="border border-rotary-ink/15 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-rotary-azure"
        />
      )}
      <ul className="flex flex-col">
        {visibles.map((s) => (
          <li
            key={s.id}
            className="py-1.5 border-t border-rotary-ink/10 flex flex-col sm:flex-row sm:items-baseline sm:gap-3 gap-0.5"
          >
            <span className="text-sm text-rotary-ink sm:w-64 shrink-0">
              {s.nombre}
              {s.rol && (
                <span className="ml-1.5 text-[11px] font-semibold text-rotary-azure">{s.rol}</span>
              )}
            </span>
            <span className="flex items-center gap-3 flex-wrap text-xs text-rotary-ink/70">
              {s.telefono && (
                <span>
                  {s.telefono}
                  <CopyButton value={s.telefono} label={`Copiar el teléfono de ${s.nombre}`} />
                </span>
              )}
              {s.email && (
                <span>
                  {s.email}
                  <CopyButton value={s.email} label={`Copiar el correo de ${s.nombre}`} />
                </span>
              )}
              {/* El usuario de My Rotary suele ser un correo personal: si no
                  hay otro contacto, es lo único que hay para ubicarlo. */}
              {!s.email && s.onlineId?.includes("@") && (
                <span className="text-rotary-ink/50">
                  usuario My Rotary: {s.onlineId}
                  <CopyButton value={s.onlineId} label={`Copiar el usuario de ${s.nombre}`} />
                </span>
              )}
              {/* Seguro: el correo o teléfono de My Rotary coincide con la
                  orden. A confirmar: coincide el nombre y el correo del
                  comprador lo respalda, pero pudo comprar otra persona. */}
              {s.origenContacto === "orden" && s.ordenId && (
                <span className="text-[11px] text-rotary-teal-dark bg-rotary-teal/10 rounded-full px-2 py-px">
                  datos de su compra #{s.ordenId}
                </span>
              )}
              {s.origenContacto === "orden-nombre" && s.ordenId && (
                <span
                  className="text-[11px] text-rotary-gold-dark bg-rotary-gold/10 rounded-full px-2 py-px"
                  title="Coincide el nombre y el correo del comprador lo respalda, pero el club de la compra no prueba que sea el socio."
                >
                  de la compra #{s.ordenId} · por nombre, a confirmar
                </span>
              )}
              {!s.telefono && !s.email && !s.onlineId && (
                <span className="text-rotary-ink/40">sin datos de contacto</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {filtro && visibles.length === 0 && (
        <p className="text-xs text-rotary-ink/50">Ningún socio coincide.</p>
      )}
    </div>
  );
}

/** Una sección plegable dentro de la tarjeta del club. */
function Seccion({
  titulo,
  detalle,
  abiertaInicial,
  children,
}: {
  titulo: string;
  detalle?: string;
  abiertaInicial: boolean;
  children: React.ReactNode;
}) {
  const [abierta, setAbierta] = useState(abiertaInicial);
  // Se monta al abrirla por primera vez y después solo se oculta, así la
  // lista de socios no se vuelve a pedir cada vez que se pliega.
  const [montada, setMontada] = useState(abiertaInicial);

  return (
    <div className="border-t border-rotary-ink/10 pt-2">
      <button
        type="button"
        onClick={() => {
          setAbierta((v) => !v);
          setMontada(true);
        }}
        aria-expanded={abierta}
        className="w-full flex items-center gap-2 text-left text-sm font-bold text-rotary-ink hover:text-rotary-azure"
      >
        <span className={`text-xs transition-transform ${abierta ? "rotate-90" : ""}`}>▶</span>
        {titulo}
        {detalle && <span className="text-xs font-normal text-rotary-ink/50">{detalle}</span>}
      </button>
      {montada && <div hidden={!abierta}>{children}</div>}
    </div>
  );
}

export type OrdenGlobal = { abiertas: boolean; version: number };

export function TarjetaClubDifusion({
  datos,
  siteUrl,
  abiertaForzada = false,
  ordenGlobal,
}: {
  datos: ClubParaDifusion;
  siteUrl: string;
  /** Mientras hay una búsqueda escrita, las tarjetas se muestran abiertas. */
  abiertaForzada?: boolean;
  /** "Abrir todas" / "Cerrar todas" del panel. */
  ordenGlobal?: OrdenGlobal;
}) {
  const { club, contactos, bonos, chicos, puesto } = datos;
  // Cuenta personas, no cargos: quien ocupa dos cargos se avisa una vez.
  const personas = contactos.filter((c) => !c.mismaPersonaQue);
  const avisados = personas.filter((c) => c.avisadoAt).length;
  const [agregando, setAgregando] = useState(false);
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    if (ordenGlobal && ordenGlobal.version > 0) setAbierta(ordenGlobal.abiertas);
  }, [ordenGlobal]);

  const visible = abierta || abiertaForzada;

  return (
    <div className="border border-rotary-ink/10 rounded-xl bg-white">
      {/* Cabecera: todo lo que hace falta para decidir si abrir el club. */}
      <div className="flex items-start gap-3 p-4">
        <button
          type="button"
          onClick={() => setAbierta((v) => !v)}
          aria-expanded={visible}
          aria-label={visible ? `Cerrar ${club}` : `Abrir ${club}`}
          className="flex-1 min-w-0 text-left flex flex-col gap-1 group"
        >
          <span className="flex items-baseline gap-2 flex-wrap">
            <span
              className={`text-xs text-rotary-ink/50 transition-transform ${visible ? "rotate-90" : ""}`}
            >
              ▶
            </span>
            <h3 className="text-base font-extrabold text-rotary-ink group-hover:text-rotary-azure">
              {club}
            </h3>
            <span className="text-xs text-rotary-ink/50">
              {[datos.numeroRotary && `Nº ${datos.numeroRotary}`, datos.diaReunion]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
          <span className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs pl-4">
            {bonos > 0 ? (
              <span className="text-rotary-ink">
                <span className="font-extrabold">{bonos}</span> bono{bonos === 1 ? "" : "s"} ·{" "}
                {chicos} chico{chicos === 1 ? "" : "s"}
                {puesto !== null && <span className="text-rotary-ink/60"> · puesto {puesto}</span>}
              </span>
            ) : (
              <span className="text-rotary-gold-dark font-semibold">Sin ventas</span>
            )}
            <span className="text-rotary-ink/60">
              {personas.length} autoridad{personas.length === 1 ? "" : "es"}
              {personas.length > 0 && ` · ${avisados} avisada${avisados === 1 ? "" : "s"}`}
            </span>
            <span className="text-rotary-ink/60">
              {datos.socios} socio{datos.socios === 1 ? "" : "s"}
              {datos.socios > 0 && ` · ${datos.sociosConContacto} con contacto`}
            </span>
          </span>
        </button>

        <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
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
      </div>

      {visible && (
        <div className="px-4 pb-4 flex flex-col gap-2">
          {datos.emailClub && (
            <p className="text-xs text-rotary-ink/70">
              Correo del club: {datos.emailClub}
              <CopyButton value={datos.emailClub} label={`Copiar el correo del club ${club}`} />
            </p>
          )}

          <Seccion
            titulo="Autoridades"
            detalle={`${personas.length}`}
            abiertaInicial
          >
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
              <p className="mt-1 text-xs text-rotary-ink/50">
                No tenemos autoridades cargadas para este club: cargalas a mano acá abajo.
              </p>
            )}
            <div className="pt-2">
              {agregando ? (
                <FormularioContacto club={club} onListo={() => setAgregando(false)} />
              ) : (
                <button
                  type="button"
                  onClick={() => setAgregando(true)}
                  className="text-xs font-semibold text-rotary-azure border border-rotary-azure/40 rounded-full px-3 py-1 hover:bg-rotary-azure/10 transition-colors"
                >
                  + Agregar autoridad
                </button>
              )}
            </div>
          </Seccion>

          <Seccion
            titulo="Socios"
            detalle={
              datos.socios > 0
                ? `${datos.socios} · ${datos.sociosConContacto} con teléfono o correo`
                : "sin cargar"
            }
            abiertaInicial={false}
          >
            <ListaSocios club={club} />
          </Seccion>
        </div>
      )}
    </div>
  );
}
