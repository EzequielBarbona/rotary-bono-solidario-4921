"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePurchase } from "@/lib/purchase-context";
import { formatArs } from "@/lib/format";
import { childrenProtected, pictogramScale, ticketsForChildren } from "@/lib/impact";
import { PersonPictogram } from "@/components/PersonPictogram";

const QUICK_OPTIONS = [1, 2, 5, 10, 20];
const TARGET_KIDS_GOAL = 100;

export function QuantityPicker({
  ticketPriceArs,
  maxPerOrder,
}: {
  ticketPriceArs: number;
  maxPerOrder: number;
}) {
  const router = useRouter();
  const { quantity, setQuantity } = usePurchase();
  const [value, setValue] = useState(quantity ?? 1);

  function clamp(n: number) {
    return Math.min(maxPerOrder, Math.max(1, n));
  }

  function handleNext() {
    setQuantity(value);
    router.push("/comprar/numeros");
  }

  const kids = childrenProtected(value * ticketPriceArs);
  const pictogram = pictogramScale(kids, kids);

  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setValue((v) => clamp(v - 1))}
          className="w-12 h-12 rounded-full border-2 border-rotary-azure text-rotary-azure text-xl font-bold hover:bg-rotary-azure/5"
        >
          −
        </button>
        <input
          type="number"
          min={1}
          max={maxPerOrder}
          value={value}
          onChange={(e) => setValue(clamp(Number(e.target.value) || 1))}
          className="w-24 text-center text-3xl font-extrabold text-rotary-ink border-2 border-rotary-ink/10 rounded-lg py-2"
        />
        <button
          type="button"
          onClick={() => setValue((v) => clamp(v + 1))}
          className="w-12 h-12 rounded-full border-2 border-rotary-azure text-rotary-azure text-xl font-bold hover:bg-rotary-azure/5"
        >
          +
        </button>
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {QUICK_OPTIONS.filter((n) => n <= maxPerOrder).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setValue(n)}
            className={`px-4 py-1.5 rounded-full border-2 text-sm font-medium transition-colors ${
              value === n
                ? "bg-rotary-azure text-white border-rotary-azure"
                : "border-rotary-ink/15 text-rotary-ink hover:border-rotary-azure"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setValue(clamp(ticketsForChildren(TARGET_KIDS_GOAL, ticketPriceArs)))}
        className="text-sm font-semibold text-white bg-rotary-azure rounded-full px-4 py-2 hover:bg-rotary-azure-dark transition-colors"
      >
        Quiero ayudar a vacunar {TARGET_KIDS_GOAL} chicos
      </button>

      <p className="text-lg text-rotary-ink">
        Total: <span className="font-extrabold">{formatArs(value * ticketPriceArs)}</span>
      </p>

      {kids > 0 && (
        <div className="flex flex-col items-center gap-2 max-w-sm">
          <p className="text-sm text-rotary-teal-dark bg-rotary-teal/10 border border-rotary-teal/30 rounded-full px-4 py-2 text-center">
            Con este aporte estás protegiendo a{" "}
            <span className="font-bold">{kids} chico{kids !== 1 ? "s" : ""}</span> contra la
            polio
          </p>
          <PersonPictogram
            total={pictogram.displayTotal}
            filled={pictogram.displayFilled}
            colorFilled="#f7a81b"
            className="w-full flex justify-center"
          />
          {pictogram.unitsPerIcon > 1 && (
            <p className="text-xs text-rotary-ink/50">
              Cada figura representa {pictogram.unitsPerIcon} chicos
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleNext}
        className="w-full max-w-xs bg-rotary-gold text-rotary-ink text-lg font-bold rounded-full py-3 hover:bg-rotary-gold-dark transition-colors"
      >
        Siguiente
      </button>
    </div>
  );
}
