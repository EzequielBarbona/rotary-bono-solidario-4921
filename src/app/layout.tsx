import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import Image from "next/image";
import { raffleConfig } from "@/lib/config";
import { SiteFooter } from "@/components/SiteFooter";
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
        <header className="bg-rotary-azure py-3 px-4 flex items-center justify-center">
          <Image
            src="/brand/rotary-endpolio-lockup-white.png"
            alt="Rotary Distrito 4921 - End Polio Now"
            width={170}
            height={76}
            priority
            className="h-9 w-auto"
          />
        </header>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
