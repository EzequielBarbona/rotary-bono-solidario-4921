import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import Link from "next/link";
import { raffleConfig } from "@/lib/config";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: raffleConfig.title,
  description: raffleConfig.title,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${openSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <footer className="py-6 flex flex-col items-center gap-2 text-center">
          <a
            href="https://wa.me/5492994736968?text=Hola%2C%20tuve%20un%20problema%20al%20comprar%20el%20bono"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-rotary-teal-dark hover:underline"
          >
            <svg
              aria-hidden
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M12 3a9 9 0 00-7.75 13.5L3 21l4.65-1.22A9 9 0 1012 3z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 8.8c.1-.6.6-.6.9-.6h.5c.2 0 .5 0 .7.5.2.5.7 1.6.7 1.8s0 .3-.1.5c-.1.2-.2.3-.4.5-.1.2-.3.3-.1.6.2.4.9 1.4 1.9 2.2 1.3 1 2.3 1.4 2.6 1.5.3.1.5.1.7-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.6.7 1.8.9.2.1.4.2.4.4 0 .2 0 1-.4 1.5-.4.5-1.4 1-2.4.9-1.7-.2-3.4-1-4.7-2.3-1.1-1-1.9-2.1-2.3-3.7-.1-.5-.1-1 0-1.4z"
                fill="currentColor"
              />
            </svg>
            Ante cualquier inconveniente, escribinos: +54 9 299 4736968
          </a>
          <Link href="/admin" className="text-xs text-rotary-ink/40 hover:text-rotary-ink/70">
            Administradores
          </Link>
        </footer>
      </body>
    </html>
  );
}
