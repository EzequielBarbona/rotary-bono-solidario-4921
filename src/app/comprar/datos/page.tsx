import { cookies } from "next/headers";
import { raffleConfig } from "@/lib/config";
import { CLUB_COOKIE, clubDeSlug } from "@/lib/clubs";
import { BuyerForm } from "@/components/BuyerForm";
import { StepHeader } from "@/components/StepHeader";

// Lee la cookie del club que invito, asi que se arma por request.
export const dynamic = "force-dynamic";

export default async function DatosPage() {
  const slug = (await cookies()).get(CLUB_COOKIE)?.value;
  const clubInvitante = slug ? clubDeSlug(slug) : null;

  return (
    <main className="flex-1 max-w-lg w-full mx-auto px-4 py-10 flex flex-col gap-8">
      <StepHeader step={3} total={3} label="Tus datos y el pago" backHref="/comprar/numeros" />
      <BuyerForm
        ticketPriceArs={raffleConfig.ticketPriceArs}
        bankAccountHolder={raffleConfig.bankAccountHolder}
        bankAlias={raffleConfig.bankAlias}
        bankCbu={raffleConfig.bankCbu}
        clubInvitante={clubInvitante}
      />
    </main>
  );
}
