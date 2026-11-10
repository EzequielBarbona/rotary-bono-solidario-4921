import { notFound } from "next/navigation";
import { campaniaDeSlug } from "@/lib/campanias";
import { TicketGrid } from "@/components/TicketGrid";
import { StepHeader } from "@/components/StepHeader";

export default async function NumerosPage({
  params,
}: PageProps<"/comprar/[campania]/numeros">) {
  const { campania: slug } = await params;
  const campania = campaniaDeSlug(slug);
  if (!campania) notFound();

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
      <StepHeader
        step={2}
        total={3}
        label="Elegí tus números"
        backHref={`/comprar/${slug}/cantidad`}
      />
      <TicketGrid
        campania={slug}
        totalTickets={campania.totalNumeros}
        primerNumero={campania.primerNumero}
        digitos={campania.digitos}
      />
    </main>
  );
}
