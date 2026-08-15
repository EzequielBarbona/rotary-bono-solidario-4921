import { raffleConfig } from "@/lib/config";
import { BuyerForm } from "@/components/BuyerForm";
import { StepHeader } from "@/components/StepHeader";

export default function DatosPage() {
  return (
    <main className="flex-1 max-w-lg w-full mx-auto px-4 py-10 flex flex-col gap-8">
      <StepHeader step={3} total={3} label="Tus datos y el pago" backHref="/comprar/numeros" />
      <BuyerForm
        ticketPriceArs={raffleConfig.ticketPriceArs}
        bankAccountHolder={raffleConfig.bankAccountHolder}
        bankAlias={raffleConfig.bankAlias}
        bankCbu={raffleConfig.bankCbu}
      />
    </main>
  );
}
