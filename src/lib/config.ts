export const raffleConfig = {
  title: process.env.RAFFLE_TITLE ?? "Bono Solidario PolioPlus - Distrito Rotary 4921",
  // URL publica del sitio. La usa la metadata para armar las URLs
  // absolutas que necesitan WhatsApp/Facebook para mostrar la tarjeta
  // con la imagen de preview. Cambiar cuando el distrito tenga dominio
  // propio (ej. https://bono.rotary4921.org).
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://rotary-bono-solidario-4921.vercel.app",
  totalTickets: Number(process.env.RAFFLE_TOTAL_TICKETS ?? 1000),
  ticketPriceArs: Number(process.env.RAFFLE_TICKET_PRICE_ARS ?? 0),
  drawDate: process.env.RAFFLE_DRAW_DATE ?? "2026-09-30",
  holdMinutes: Number(process.env.RAFFLE_HOLD_MINUTES ?? 72 * 60),
  maxTicketsPerOrder: 50,
  maxReceiptSizeBytes: 8 * 1024 * 1024,
  bankAccountHolder: process.env.RAFFLE_BANK_HOLDER ?? "Rotary Club Distrito 4921 (a definir)",
  bankAlias: process.env.RAFFLE_BANK_ALIAS ?? "ALIAS.A.DEFINIR",
  bankCbu: process.env.RAFFLE_BANK_CBU ?? "0000000000000000000000",
  // Tipo de cambio de referencia para estimar el impacto en vacunas.
  // Es un valor fijo que el subcomite actualiza a mano cada tanto (no se
  // consulta una cotizacion en vivo).
  usdArsRate: Number(process.env.RAFFLE_USD_ARS_RATE ?? 1515),
  // Costo real publicado por Rotary para proteger a un chico contra la
  // polio (vacuna + logistica de aplicacion). Fuente: endpolio.org,
  // "6 Key Numbers in the Fight to End Polio".
  costPerChildUsd: 3,
  // La Fundacion Gates iguala 2 a 1 las donaciones que llegan al
  // PolioPlus Fund oficial, así que el aporte real se triplica. Si en
  // algun momento el dinero recaudado deja de ir al fondo oficial, poner
  // esta variable en 1 para dejar de mostrar el match.
  gatesMatchMultiplier: Number(process.env.RAFFLE_GATES_MATCH_MULTIPLIER ?? 3),
};
