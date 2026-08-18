"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

export function SiteFooter() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <footer className="py-6 flex flex-col items-center gap-2 text-center">
      {!isAdmin && (
        <a
          href="https://wa.me/5492994736968?text=Hola%2C%20tuve%20un%20problema%20al%20comprar%20el%20bono"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-rotary-teal-dark hover:underline"
        >
          <WhatsAppIcon />
          Ante cualquier inconveniente, escribinos: +54 9 299 4736968
        </a>
      )}
      <Link href="/admin" className="text-xs text-rotary-ink/40 hover:text-rotary-ink/70">
        Administradores
      </Link>
    </footer>
  );
}
