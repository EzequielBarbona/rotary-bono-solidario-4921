import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { campaniaDeSlug, DOCUMENTOS } from "@/lib/campanias";
import { CLUB_COOKIE, clubDeSlug } from "@/lib/clubs";
import { BuyerForm } from "@/components/BuyerForm";
import { StepHeader } from "@/components/StepHeader";

// Lee la cookie del club que invito, asi que se arma por request.
export const dynamic = "force-dynamic";

export default async function DatosPage({
  params,
}: PageProps<"/comprar/[campania]/datos">) {
  const { campania: slug } = await params;
  const campania = campaniaDeSlug(slug);
  if (!campania) notFound();

  // El club invitante solo existe en las campañas que lo preguntan: en la
  // venta directa, una cookie vieja del PolioPlus no tiene que aparecer.
  const cookieClub = campania.pideClub
    ? (await cookies()).get(CLUB_COOKIE)?.value
    : undefined;
  const clubInvitante = cookieClub ? clubDeSlug(cookieClub) : null;

  return (
    <main className="flex-1 max-w-lg w-full mx-auto px-4 py-10 flex flex-col gap-8">
      <StepHeader
        step={3}
        total={3}
        label="Tus datos y el pago"
        backHref={`/comprar/${slug}/numeros`}
      />
      <BuyerForm
        campania={slug}
        ticketPriceArs={campania.precioArs}
        digitos={campania.digitos}
        pideClub={campania.pideClub}
        documento={DOCUMENTOS[campania.documento]}
        mostrarImpactoPolio={campania.slug === "polioplus"}
        cuenta={campania.cuenta}
        soporte={campania.soporte}
        clubInvitante={clubInvitante}
      />
    </main>
  );
}
