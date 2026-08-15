import Link from "next/link";

export function StepHeader({
  step,
  total,
  label,
  backHref,
}: {
  step: number;
  total: number;
  label: string;
  backHref: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm">
        <Link href={backHref} className="text-rotary-azure font-medium hover:underline">
          ‹ Volver
        </Link>
        <span className="text-rotary-ink/60">
          Paso {step} de {total}
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
          <span
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              s <= step ? "bg-rotary-azure" : "bg-rotary-azure/15"
            }`}
          />
        ))}
      </div>
      <h1 className="text-2xl font-extrabold text-rotary-ink">{label}</h1>
    </div>
  );
}
