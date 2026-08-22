"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePurchase } from "@/lib/purchase-context";
import { formatArs } from "@/lib/format";
import { CopyButton } from "@/components/CopyButton";
import { DISTRICT_CLUBS, OTRO_CLUB, SIN_CLUB, hayListaDeClubes } from "@/lib/clubs";
import { childrenProtected, pictogramScale } from "@/lib/impact";
import { PersonPictogram } from "@/components/PersonPictogram";

export function BuyerForm({
  ticketPriceArs,
  bankAccountHolder,
  bankAlias,
  bankCbu,
  clubInvitante,
}: {
  ticketPriceArs: number;
  bankAccountHolder: string;
  bankAlias: string;
  bankCbu: string;
  /** Club por cuyo link entro el comprador, si entro por uno. */
  clubInvitante: string | null;
}) {
  const router = useRouter();
  const { quantity, selectedNumbers } = usePurchase();
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerCuit, setBuyerCuit] = useState("");
  // Si entro por el link de un club, ese club ya viene elegido. Igual
  // queda editable: puede pasarle el link a alguien de otro lado.
  const [buyerClub, setBuyerClub] = useState(clubInvitante ?? "");
  const [otroClub, setOtroClub] = useState("");
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
      setError("Subí una captura del comprobante de transferencia.");
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
      formData.set("buyerClub", buyerClub === OTRO_CLUB ? otroClub.trim() : buyerClub);
      formData.set("receipt", receiptFile);

      const res = await fetch("/api/reserve", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo completar la reserva.");
        return;
      }
      router.push(`/orden/${data.orderId}`);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-rotary-ink/10 bg-rotary-azure/5 rounded-lg p-4 flex flex-col gap-1 text-rotary-ink">
        <p>
          <span className="font-semibold">Números:</span> {numbersText}
        </p>
        <p>
          <span className="font-semibold">Total:</span>{" "}
          <span className="font-extrabold">{formatArs(total)}</span>
        </p>
        {kids > 0 && (
          <>
            <p className="text-base text-rotary-teal-dark">
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

      <div className="border border-rotary-gold/40 bg-rotary-gold/10 rounded-lg p-4 flex flex-col gap-1.5 text-rotary-ink text-sm">
        <p className="font-bold">Transferí el total a esta cuenta</p>
        <p>
          <span className="font-semibold">Titular:</span> {bankAccountHolder}
        </p>
        <p>
          <span className="font-semibold">Alias:</span> {bankAlias}
          <CopyButton value={bankAlias} label="Copiar alias" />
        </p>
        <p className="break-all">
          <span className="font-semibold">CBU/CVU:</span> {bankCbu}
          <CopyButton value={bankCbu} label="Copiar CBU/CVU" />
        </p>
        <p>
          <span className="font-semibold">Monto:</span> {formatArs(total)}
          {/* Se copia el numero pelado: es lo que se pega en el home banking. */}
          <CopyButton value={String(total)} label="Copiar monto" />
        </p>
        <p className="text-rotary-ink/70 mt-1">
          Después subí la captura de esa transferencia en el formulario.
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
          placeholder="Teléfono / WhatsApp"
          value={buyerPhone}
          onChange={(e) => setBuyerPhone(e.target.value)}
          className="border border-rotary-ink/15 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rotary-azure"
        />
        <input
          required
          placeholder="CUIT / CUIL con el que transferís"
          value={buyerCuit}
          onChange={(e) => setBuyerCuit(e.target.value)}
          className="border border-rotary-ink/15 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rotary-azure"
        />
        {/* Con el padron cargado se elige de una lista, para que el ranking
            de clubes no se fragmente ("cipo" y "cipolletti" son el mismo
            club). Sin padron todavia, se sigue pidiendo como texto libre.

            La pregunta es "quien te invito" y no "de que club sos": el
            bono lo difunden los clubes en sus ciudades y la mayoria de
            los compradores no van a ser socios de ninguno. Preguntado al
            reves, todo vecino contesta "no soy rotario" y el club que
            hizo el trabajo se queda sin el punto. */}
        {hayListaDeClubes() ? (
          <>
            {clubInvitante && (
              <p className="text-sm bg-rotary-azure/10 text-rotary-ink rounded-lg px-3 py-2.5">
                Tu compra suma al club{" "}
                <span className="font-bold">{clubInvitante}</span>. Si no es
                así, cambialo acá abajo.
              </p>
            )}
            <select
              required
              value={buyerClub}
              onChange={(e) => setBuyerClub(e.target.value)}
              className="border border-rotary-ink/15 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-rotary-azure"
            >
              <option value="" disabled>
                ¿Qué club te invitó a colaborar?
              </option>
              <option value={OTRO_CLUB}>{OTRO_CLUB} (de otro distrito)</option>
              {/* El valor guardado no cambia (lo usa el ranking), solo el
                  texto: "no soy rotario" no contesta esta pregunta. */}
              <option value={SIN_CLUB}>Ninguno, llegué por mi cuenta</option>
              <option disabled>──────────</option>
              {DISTRICT_CLUBS.map((club) => (
                <option key={club} value={club}>
                  {club}
                </option>
              ))}
            </select>
            {buyerClub === OTRO_CLUB && (
              <input
                required
                placeholder="¿Cuál es tu club?"
                value={otroClub}
                onChange={(e) => setOtroClub(e.target.value)}
                className="border border-rotary-ink/15 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rotary-azure"
              />
            )}
          </>
        ) : (
          <input
            placeholder="¿Qué club te invitó a colaborar? (opcional)"
            value={buyerClub}
            onChange={(e) => setBuyerClub(e.target.value)}
            className="border border-rotary-ink/15 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rotary-azure"
          />
        )}

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
            ¿Por qué te pedimos estos datos?
          </summary>
          <div className="mt-3 leading-relaxed bg-rotary-ink/5 rounded-lg p-4 text-rotary-ink/70 flex flex-col gap-2">
            <p>
              <span className="font-semibold text-rotary-ink">Nombre, email y teléfono:</span>{" "}
              para mandarte la confirmación con tus números una vez que verifiquemos el pago,
              y para poder contactarte si sos ganador del sorteo.
            </p>
            <p>
              <span className="font-semibold text-rotary-ink">CUIT/CUIL:</span> las
              transferencias bancarias muestran el CUIT de quien las hace, así que lo usamos
              para cruzar tu pago con tu compra más rápido y con más seguridad, sobre todo si
              hay varias compras con montos parecidos el mismo día.
            </p>
            <p>
              <span className="font-semibold text-rotary-ink">
                Club que te invitó:
              </span>{" "}
              los clubes del distrito difunden el bono en sus ciudades y compiten
              entre ellos por cuántos chicos ayudan a vacunar. Tu compra suma a la
              cuenta del club que te invitó, sin importar si sos socio o no. Si
              llegaste por tu cuenta, elegí esa opción y tu aporte suma igual.
            </p>
            <p>
              <span className="font-semibold text-rotary-ink">Captura del comprobante:</span>{" "}
              es la prueba de que hiciste la transferencia &mdash; sin ella no podemos
              confirmar tu pago ni liberar tus números de forma definitiva.
            </p>
            <p className="text-rotary-ink/60">
              Tus datos los usamos solo para gestionar este bono solidario (confirmar el
              pago y contactarte) &mdash; no se comparten con nadie más.
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
