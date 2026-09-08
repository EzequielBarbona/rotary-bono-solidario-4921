"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/admin/LogoutButton";

/**
 * Las cuatro pantallas del panel, siempre a la vista.
 *
 * Antes cada pagina llevaba su propio juego de links, distinto en cada
 * una, y algunos vivian metidos adentro de un parrafo explicativo: para
 * pasar de difusion a ventas por semana habia que volver al panel
 * primero, y para enterarse de que existia el ranking por club habia que
 * leer una nota al pie. La barra queda pegada arriba, asi que se llega a
 * cualquier seccion desde cualquier lugar de cualquier pagina.
 */
const SECCIONES = [
  { href: "/admin", texto: "Órdenes" },
  { href: "/admin/ventas", texto: "Ventas por semana" },
  { href: "/admin/clubes", texto: "Ventas por club" },
  { href: "/admin/difusion", texto: "Difusión" },
];

export function NavAdmin() {
  const pathname = usePathname();
  const pestanas = useRef<HTMLDivElement>(null);

  // En un celular las cuatro pestañas no entran y la activa puede quedar
  // fuera de cuadro: sin esto entras a "Difusión" y la barra parece decir
  // que estas en "Órdenes". Movemos solo el scroll horizontal de la fila;
  // scrollIntoView arrastraria tambien al documento.
  useEffect(() => {
    const caja = pestanas.current;
    const activa = caja?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!caja || !activa) return;
    const centro =
      activa.offsetLeft - caja.offsetLeft - (caja.clientWidth - activa.clientWidth) / 2;
    caja.scrollLeft = Math.max(0, centro);
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-rotary-ink/10">
      <div className="max-w-4xl mx-auto px-4 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* Con cuatro secciones no entra en un celular angosto: scrollea
            en horizontal en vez de apilarse o cortar los nombres. */}
        <div ref={pestanas} className="flex items-center gap-1 overflow-x-auto">
          {SECCIONES.map((seccion) => {
            const activa = pathname === seccion.href;
            return (
              <Link
                key={seccion.href}
                href={seccion.href}
                aria-current={activa ? "page" : undefined}
                className={`whitespace-nowrap text-sm rounded-full px-3 py-1.5 transition-colors ${
                  activa
                    ? "bg-rotary-azure text-white font-bold"
                    : "text-rotary-ink/70 hover:bg-rotary-ink/5 hover:text-rotary-ink"
                }`}
              >
                {seccion.texto}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <Link
            href="/"
            className="text-sm text-rotary-azure hover:underline whitespace-nowrap"
          >
            Ver el sitio
          </Link>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
