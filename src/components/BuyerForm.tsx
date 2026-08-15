"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePurchase } from "@/lib/purchase-context";
import { formatArs } from "@/lib/format";
import { childrenProtected, pictogramScale } from "@/lib/impact";
import { PersonPictogram } from "@/components/PersonPictogram";

export function BuyerForm({
  ticketPriceArs,
  bankAccountHolder,
  bankAlias,
  bankCbu,
}: {
  ticketPriceArs: number;
  bankAccountHolder: string;
  bankAlias: string;
  bankCbu: string;
}) {
  const router = useRouter();
  const { quantity, selectedNumbers } = usePurchase();
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerCuit, setBuyerCuit] = useState("");
  const [buyerClub, setBuyerClub] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missingSelection = !quantity || selectedNumbers.length !== quantity;

  useEffect(() => {
    if (missingSelection) {
      router.replace(quantity ? "/comprar/numeros" : "/comprar/cantidad");
    }
  }, [missingSelection, quantity, router]);

  if (missingSelection) {
    return null;
  }

  const total = selectedNumbers.length * ticketPriceArs;
  const kids = childrenProtected(total);
  const pictogram = pictogramScale(kids, kids);
  const numbersText = [...selectedNumbers]
    .sort((a, b) => a - b)
    .map((n) => n.toString().padStart(4, "0"))
    .join(", ");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!receiptFile) {
      setError("Subi una captura del comprobante de transferencia.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("numbers", JSON.stringify(selectedNumbers));
      formData.set("buyerName", buyerName);
      formData.set("buyerEmail", buyerEmail);
      formData.set("buyerPhone", buyerPhone);
      formData.set("buyerCuit", buyerCuit);
      formData.set("buyerClub", buyerClub);
      formData.set("receipt", receiptFile);

      const res = await fetch("/api/reserve", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo completar la reserva.");
        return;
      }
      router.push(`/orden/${data.orderId}`);
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-rotary-ink/10 bg-rotary-azure/5 rounded-lg p-4 flex flex-col gap-1 text-rotary-ink">
        <p>
          <span className="font-semibold">Numeros:</span> {numbersText}
        </p>
        <p>
          <span className="font-semibold">Total:</span>{" "}
          <span className="font-extrabold">{formatArs(total)}</span>
        </p>
        {kids > 0 && (
          <>
            <p className="text-rotary-teal-dark">
              Estás aportando para proteger a{" "}
              <span className="font-bold">
                {kids} chico{kids !== 1 ? "s" : ""}
              </span>{" "}
              contra la polio.
            </p>
            <PersonPictogram
              total={pictogram.displayTotal}
              filled={pictogram.displayFilled}
              colorFilled="#f7a81b"
              className="mt-1"
            />
            {pictogram.unitsPerIcon > 1 && (
              <p className="text-xs text-rotary-ink/50">
                Cada figura representa {pictogram.unitsPerIcon} chicos
              </p>
            )}
          </>
        )}
      </div>

      <div className="border border-rotary-gold/40 bg-rotary-gold/10 rounded-lg p-4 flex flex-col gap-1 text-rotary-ink text-sm">
        <p className="font-bold">Transferi el total a esta cuenta</p>
        <p>
          <span className="font-semibold">Titular:</span> {bankAccountHolder}
        </p>
        <p>
          <span className="font-semibold">Alias:</span> {bankAlias}
        </p>
        <p>
          <span className="font-semibold">CBU:</span> {bankCbu}
        </p>
        <p className="text-rotary-ink/70 mt-1">
          Despues subi la captura de esa transferencia en el formulario.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          required
          placeholder="Nombre y apellido"
          value={buyerName}
          onChange={(e) => setBuyerName(e.target.value)}
          className="border border-rotary-ink/15 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rotary-azure"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={buyerEmail}
          onChange={(e) => setBuyerEmail(e.target.value)}
          className="border border-rotary-ink/15 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rotary-azure"
        />
        <input
          required
          placeholder="Telefono / WhatsApp"
          value={buyerPhone}
          onChange={(e) => setBuyerPhone(e.target.value)}
          className="border border-rotary-ink/15 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rotary-azure"
        />
        <input
          required
          placeholder="CUIT / CUIL con el que transferis"
          value={buyerCuit}
          onChange={(e) => setBuyerCuit(e.target.value)}
          className="border border-rotary-ink/15 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rotary-azure"
        />
        <input
          placeholder="Club al que pertenecés (opcional)"
          value={buyerClub}
          onChange={(e) => setBuyerClub(e.target.value)}
          className="border border-rotary-ink/15 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rotary-azure"
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-rotary-ink">
            Captura del comprobante de transferencia
          </span>
          <input
            required
            type="file"
            accept="image/*"
            onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
            className="border border-rotary-ink/15 rounded-lg px-3 py-2.5 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-rotary-azure file:text-white file:font-medium"
          />
        </label>

        <details className="text-xs text-rotary-ink/50">
          <summary className="cursor-pointer hover:text-rotary-ink/75 transition-colors">
            ¿Por que te pedimos estos datos?
          </summary>
          <div className="mt-3 leading-relaxed bg-rotary-ink/5 rounded-lg p-4 text-rotary-ink/70 flex flex-col gap-2">
            <p>
              <span className="font-semibold text-rotary-ink">Nombre, email y telefono:</span>{" "}
              para mandarte la confirmacion con tus numeros una vez que verifiquemos el pago,
              y para poder contactarte si sos ganador del sorteo.
            </p>
            <p>
              <span className="font-semibold text-rotary-ink">CUIT/CUIL:</span> las
              transferencias bancarias muestran el CUIT de quien las hace, asi que lo usamos
              para cruzar tu pago con tu compra mas rapido y con mas seguridad, sobre todo si
              hay varias compras con montos parecidos el mismo dia.
            </p>
            <p>
              <span className="font-semibold text-rotary-ink">
                Club al que pertenecés (opcional):
              </span>{" "}
              nos sirve para saber que clubes del distrito estan colaborando. No es
              obligatorio si no pertenecés a ninguno.
            </p>
            <p>
              <span className="font-semibold text-rotary-ink">Captura del comprobante:</span>{" "}
              es la prueba de que hiciste la transferencia &mdash; sin ella no podemos
              confirmar tu pago ni liberar tus numeros de forma definitiva.
            </p>
            <p className="text-rotary-ink/60">
              Tus datos los usamos solo para gestionar esta rifa (confirmar el pago y
              contactarte) &mdash; no se comparten con nadie mas.
            </p>
          </div>
        </details>

        <button
          type="submit"
          disabled={submitting}
          className="bg-rotary-gold text-rotary-ink text-lg font-bold rounded-full py-3 hover:bg-rotary-gold-dark disabled:opacity-50 transition-colors"
        >
          {submitting ? "Procesando..." : "Enviar y reservar"}
        </button>
      </form>
    </div>
  );
}
