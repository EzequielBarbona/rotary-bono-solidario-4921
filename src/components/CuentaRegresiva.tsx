"use client";

import { useEffect, useState } from "react";

/*
 * Cuenta regresiva hasta el cierre de la venta.
 *
 * El reloj corre en el navegador, pero el numero del primer dibujo lo
 * manda el servidor: si el componente arrancara leyendo la hora local, el
 * HTML del servidor y el del navegador no coincidirian y React tiraria
 * todo abajo para rehacerlo. Recien despues de montarse pasa a contar
 * contra el instante del cierre, que es absoluto y da lo mismo en
 * cualquier huso horario.
 */

const SEGUNDO = 1000;
const MINUTO = 60 * SEGUNDO;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

/** Debajo de esto el cierre deja de ser una fecha y pasa a ser hoy. */
const UMBRAL_URGENTE = DIA;

function desglosar(restante: number) {
  const total = Math.max(0, restante);
  return {
    dias: Math.floor(total / DIA),
    horas: Math.floor((total % DIA) / HORA),
    minutos: Math.floor((total % HORA) / MINUTO),
    segundos: Math.floor((total % MINUTO) / SEGUNDO),
  };
}

export function CuentaRegresiva({
  cierraEn,
  restanteInicial,
  textoCierre,
}: {
  /** Instante del cierre en milisegundos desde época. */
  cierraEn: number;
  /** Cuanto faltaba cuando el servidor dibujo la pagina. */
  restanteInicial: number;
  /** El cierre en palabras: "sábado 24/10 a las 18:00". */
  textoCierre: string;
}) {
  const [restante, setRestante] = useState(restanteInicial);

  useEffect(() => {
    const actualizar = () => setRestante(cierraEn - Date.now());
    actualizar();
    const id = setInterval(actualizar, SEGUNDO);
    return () => clearInterval(id);
  }, [cierraEn]);

  if (restante <= 0) {
    return (
      <div className="w-full max-w-sm rounded-2xl bg-white/15 px-5 py-4 flex flex-col items-center gap-1">
        <span className="text-xl font-extrabold">La venta cerró</span>
        <span className="text-sm text-white/75">Cerró el {textoCierre}</span>
      </div>
    );
  }

  const { dias, horas, minutos, segundos } = desglosar(restante);
  const urgente = restante < UMBRAL_URGENTE;

  // Para quien escucha la página: sin segundos, que cambian más rápido de
  // lo que se leen, y sin los ceros a la izquierda de los casilleros.
  const enPalabras = [
    dias > 0 && `${dias} ${dias === 1 ? "día" : "días"}`,
    `${horas} ${horas === 1 ? "hora" : "horas"}`,
    `${minutos} ${minutos === 1 ? "minuto" : "minutos"}`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      role="timer"
      aria-label={`Faltan ${enPalabras} para que cierre la venta`}
      className={`w-full max-w-sm rounded-2xl px-4 py-3 sm:px-5 sm:py-4 flex flex-col items-center gap-1.5 sm:gap-2 ${
        urgente ? "bg-rotary-cardinal" : "bg-white/15"
      }`}
    >
      <span className="uppercase tracking-widest text-xs font-bold text-rotary-gold">
        Últimas horas para ayudar
      </span>

      <div className="flex items-start gap-2 sm:gap-3">
        {/* Con menos de un dia, "0 días" solo ocupa lugar y resta urgencia. */}
        {dias > 0 && <Casillero valor={dias} etiqueta={dias === 1 ? "día" : "días"} />}
        <Casillero valor={horas} etiqueta="horas" />
        <Casillero valor={minutos} etiqueta="min" />
        <Casillero valor={segundos} etiqueta="seg" />
      </div>

      <span className="text-xs text-white/75">Cierra el {textoCierre}</span>
    </div>
  );
}

function Casillero({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <div className="flex flex-col items-center min-w-[2.75rem] sm:min-w-[3.25rem]">
      {/* Ancho de cifra fijo y dos digitos siempre: si no, el cartel se
          mueve a cada segundo. */}
      <span className="text-2xl sm:text-4xl font-extrabold tabular-nums leading-none">
        {String(valor).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[0.7rem] uppercase tracking-wide text-white/70">
        {etiqueta}
      </span>
    </div>
  );
}
