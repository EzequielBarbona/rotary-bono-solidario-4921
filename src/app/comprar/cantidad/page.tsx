import { raffleConfig } from "@/lib/config";
import { QuantityPicker } from "@/components/QuantityPicker";
import { StepHeader } from "@/components/StepHeader";

export default function CantidadPage() {
  return (
    <main className="flex-1 max-w-lg w-full mx-auto px-4 py-10 flex flex-col gap-8">
      <StepHeader step={1} total={3} label="Cuántos números querés comprar" backHref="/" />
      <QuantityPicker
        ticketPriceArs={raffleConfig.ticketPriceArs}
        maxPerOrder={raffleConfig.maxTicketsPerOrder}
      />
    </main>
  );
}
