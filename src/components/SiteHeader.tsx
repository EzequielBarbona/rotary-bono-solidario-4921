"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  // En la home el logo ya va integrado adentro del hero celeste, con la
  // version blanca. Acá solo hace falta esta barra en el resto de las
  // pantallas (fondo blanco), con la version de colores del logo.
  if (pathname === "/") return null;

  return (
    <header className="bg-white py-4 px-4 flex items-center justify-center border-b border-rotary-ink/5">
      <Image
        src="/brand/rotary-endpolio-lockup-color.png"
        alt="Rotary Distrito 4921 - End Polio Now"
        width={340}
        height={152}
        priority
        className="h-12 sm:h-16 w-auto"
      />
    </header>
  );
}
