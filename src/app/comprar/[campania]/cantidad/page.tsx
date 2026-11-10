import { notFound } from "next/navigation";
import { raffleConfig } from "@/lib/config";
import { campaniaDeSlug } from "@/lib/campanias";
import { QuantityPicker } from "@/components/QuantityPicker";
import { StepHeader } from "@/components/StepHeader";

export default async function CantidadPage({
  params,
}: PageProps<"/comprar/[campania]/cantidad">) {
  const { campania: slug } = await params;
  const campania = campaniaDeSlug(slug);
  if (!campania) notFound();

  return (
    <main className="flex-1 max-w-lg w-full mx-auto px-4 py-10 flex flex-col gap-8">
      <StepHeader
        step={1}
        total={3}
        label="Cuántos números querés comprar"
        backHref={campania.ruta}
      />
      <QuantityPicker
        campania={slug}
        ticketPriceArs={campania.precioArs}
        maxPerOrder={raffleConfig.maxTicketsPerOrder}
        // El cartel de los chicos vacunados es del PolioPlus: en la
        // camiseta no hay ninguna equivalencia real que mostrar.
        mostrarImpactoPolio={campania.slug === "polioplus"}
      />
    </main>
  );
}
