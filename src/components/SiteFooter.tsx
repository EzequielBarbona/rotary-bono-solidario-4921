"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { soporteDeRuta } from "@/lib/campanias";

export function SiteFooter() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  // Cada campaña atiende sus propios WhatsApp: la camiseta la atienden
  // Rotary Neuquen y Moiru, el PolioPlus el subcomite del distrito.
  const contactos = soporteDeRuta(pathname);

  return (
    <footer className="py-6 flex flex-col items-center gap-2 text-center">
      {!isAdmin && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm text-foreground/70">
            Ante cualquier inconveniente, escribinos:
          </p>
          {/* Uno debajo del otro y con el nombre adelante: en una sola
              linea, dos numeros seguidos no se sabe de quien son. */}
          <div className="flex flex-col sm:flex-row items-center gap-x-5 gap-y-1">
            {contactos.map((contacto) => (
              <a
                key={contacto.wa}
                href={`https://wa.me/${contacto.wa}?text=${encodeURIComponent(
                  "Hola, tuve un problema al comprar el bono"
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-rotary-teal-dark hover:underline"
              >
                <WhatsAppIcon />
                {contactos.length > 1 ? `${contacto.quien}: ` : ""}
                {contacto.texto}
              </a>
            ))}
          </div>
        </div>
      )}
      <Link href="/admin" className="text-xs text-rotary-ink/40 hover:text-rotary-ink/70">
        Administradores
      </Link>
    </footer>
  );
}
