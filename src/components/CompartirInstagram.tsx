"use client";

import { useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { InstagramIcon } from "@/components/InstagramIcon";

/**
 * Material para publicar en Instagram.
 *
 * No hay boton equivalente al de WhatsApp porque Instagram no tiene forma
 * de abrirse con un link y un texto cargados desde una pagina, y en el
 * pie de foto los links no son clickeables. Se publica subiendo una
 * imagen, asi que eso es lo que entregamos: la pieza lista en los dos
 * formatos y el texto para pegar.
 *
 * En celulares que soportan compartir archivos, ademas ofrecemos mandar
 * la imagen directo al menu del sistema, donde Instagram aparece como una
 * opcion mas. Es lo mas parecido a un "compartir en Instagram" que la
 * plataforma permite.
 */
export function CompartirInstagram({ enlace, texto }: { enlace: string; texto: string }) {
  const [abierto, setAbierto] = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function compartirImagen() {
    setCompartiendo(true);
    setError(null);
    try {
      const res = await fetch("/flyer/post");
      const blob = await res.blob();
      const archivo = new File([blob], "bono-polioplus.png", { type: "image/png" });
      if (!navigator.canShare?.({ files: [archivo] })) {
        setError("Tu teléfono no permite compartir la imagen así. Descargala y subila a mano.");
        return;
      }
      await navigator.share({ files: [archivo], text: texto });
    } catch (err) {
      // Cancelar el menú de compartir tira AbortError: no es un error real.
      if ((err as Error)?.name !== "AbortError") {
        setError("No se pudo compartir la imagen. Descargala y subila a mano.");
      }
    } finally {
      setCompartiendo(false);
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center justify-center gap-2 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white font-bold text-lg px-8 py-4 rounded-full hover:opacity-90 transition-opacity"
      >
        <InstagramIcon />
        Compartir en Instagram
      </button>
    );
  }

  return (
    <div className="w-full border border-rotary-ink/15 rounded-xl p-5 flex flex-col gap-4 text-left">
      <p className="text-sm text-rotary-ink/70">
        Instagram no deja compartir un link desde una página, y en el pie de
        foto los links no se pueden clickear. Se publica así:
      </p>

      <button
        type="button"
        onClick={compartirImagen}
        disabled={compartiendo}
        className="sm:hidden inline-flex items-center justify-center gap-2 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white font-bold px-5 py-3 rounded-full disabled:opacity-60"
      >
        <InstagramIcon size={18} />
        {compartiendo ? "Preparando…" : "Mandar la imagen a Instagram"}
      </button>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-bold text-rotary-ink">1. Descargá la imagen</p>
        <div className="flex flex-wrap gap-2">
          <a
            href="/flyer/post"
            className="text-sm font-semibold text-rotary-azure border border-rotary-azure/40 rounded-full px-3 py-1.5 hover:bg-rotary-azure/10 transition-colors"
          >
            Para publicación
          </a>
          <a
            href="/flyer/historia"
            className="text-sm font-semibold text-rotary-azure border border-rotary-azure/40 rounded-full px-3 py-1.5 hover:bg-rotary-azure/10 transition-colors"
          >
            Para historia
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-bold text-rotary-ink">
          2. Copiá el texto para el pie de foto
          <CopyButton value={texto} label="Copiar el texto de la publicación" texto="Copiar texto" />
        </p>
        <pre className="text-xs text-rotary-ink/70 bg-rotary-ink/5 rounded-lg p-3 whitespace-pre-wrap font-sans">
          {texto}
        </pre>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-bold text-rotary-ink">
          3. Pegá el link en tu biografía
          <CopyButton value={enlace} label="Copiar el link del bono" texto="Copiar link" />
        </p>
        <p className="text-xs text-rotary-ink/60">
          En una historia también podés usar el sticker de link. En el pie de
          foto no sirve de nada: no se puede clickear.
        </p>
      </div>

      {error && <p className="text-sm text-amber-700">{error}</p>}

      <button
        type="button"
        onClick={() => setAbierto(false)}
        className="self-start text-sm text-rotary-azure hover:underline"
      >
        Cerrar
      </button>
    </div>
  );
}
