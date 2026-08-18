import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { raffleConfig } from "@/lib/config";
import { formatArs } from "@/lib/format";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
});

/*
 * WhatsApp (y Facebook/Instagram) arman la tarjeta del link con estos
 * datos mas la imagen de opengraph-image.tsx. Sin metadataBase la URL de
 * la imagen sale relativa y esas apps no la muestran.
 */
const description =
  "Sorteamos una estadía de 5 noches para 2 personas en Bariloche o Las Grutas. " +
  `Bonos de ${formatArs(raffleConfig.ticketPriceArs)}: lo recaudado va al programa ` +
  "PolioPlus de Rotary International para erradicar la polio.";

export const metadata: Metadata = {
  metadataBase: new URL(raffleConfig.siteUrl),
  title: raffleConfig.title,
  description,
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: "Bono Solidario PolioPlus",
    title: raffleConfig.title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: raffleConfig.title,
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${openSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
