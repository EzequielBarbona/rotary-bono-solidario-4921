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
        <footer className="py-6 text-center">
          <Link href="/admin" className="text-xs text-rotary-ink/40 hover:text-rotary-ink/70">
            Administradores
          </Link>
        </footer>
      </body>
    </html>
  );
}
