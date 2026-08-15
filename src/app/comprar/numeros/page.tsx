import { raffleConfig } from "@/lib/config";
import { TicketGrid } from "@/components/TicketGrid";
import { StepHeader } from "@/components/StepHeader";

export default function NumerosPage() {
  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
      <StepHeader step={2} total={3} label="Elegí tus números" backHref="/comprar/cantidad" />
      <TicketGrid totalTickets={raffleConfig.totalTickets} />
    </main>
  );
}
