import Link from "next/link";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { raffleConfig } from "@/lib/config";
import { RUTA_DISTRITO } from "@/lib/clubs";
import { clubesParaDifusion } from "@/lib/difusion";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { PanelDifusion } from "@/components/admin/PanelDifusion";

// Las ventas y las marcas de avisado se mueven todo el tiempo.
export const dynamic = "force-dynamic";

export default async function DifusionPage() {
  if (!(await isAdminSessionActive())) {
    return <AdminLogin />;
  }

  const clubes = await clubesParaDifusion();

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-extrabold text-rotary-ink">Difusión por club</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/clubes" className="text-sm text-rotary-azure hover:underline">
            Ventas por club
          </Link>
          <Link href="/admin" className="text-sm text-rotary-azure hover:underline">
            ‹ Volver al panel
          </Link>
        </div>
      </div>

      <p className="text-sm text-rotary-ink/70">
        Cada club con su link, su volante imprimible y sus autoridades. Quien
        compre entrando por el link de un club le suma a ese club en la copa,
        aunque no sea rotario. Las ventas están al lado de los contactos a
        propósito: el mensaje a un club que va segundo no es el mismo que el
        que le mandás a uno que todavía no arrancó.
      </p>

      <PanelDifusion
        clubes={clubes}
        siteUrl={raffleConfig.siteUrl}
        rutaDistrito={RUTA_DISTRITO}
      />

      <p className="text-xs text-rotary-ink/50">
        Las autoridades salen del padrón 2026-2027 que pasó el distrito, que
        cubre solo los clubes rotarios: los Rotaract y los satélites aparecen
        con su link y su volante, pero sin contactos.
      </p>

      <Link
        href="/admin"
        className="self-center text-sm text-rotary-azure hover:underline mt-2"
      >
        ‹ Volver al panel
      </Link>
    </main>
  );
}
