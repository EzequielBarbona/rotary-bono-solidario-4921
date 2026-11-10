"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { soporteDeRuta } from "@/lib/campanias";

export function SiteFooter() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  // Cada campaña atiende su propio WhatsApp: la camiseta la atiende
  // Rotary Neuquen y el PolioPlus el subcomite del distrito.
  const soporte = soporteDeRuta(pathname);

  return (
    <footer className="py-6 flex flex-col items-center gap-2 text-center">
      {!isAdmin && (
        <a
          href={`https://wa.me/${soporte.wa}?text=${encodeURIComponent(
            "Hola, tuve un problema al comprar el bono"
          )}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-rotary-teal-dark hover:underline"
        >
          <WhatsAppIcon />
          Ante cualquier inconveniente, escribinos: {soporte.texto}
        </a>
      )}
      <Link href="/admin" className="text-xs text-rotary-ink/40 hover:text-rotary-ink/70">
        Administradores
      </Link>
    </footer>
  );
}
