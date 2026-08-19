export function formatArs(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Convierte una fecha "YYYY-MM-DD" a "DD/MM/YYYY" para mostrarla al estilo argentino. */
export function formatDateArs(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

/**
 * La fecha del sorteo se muestra como "a definir" mientras el subcomite
 * no la haya cerrado. Cuando este definida se carga en RAFFLE_DRAW_DATE
 * y aparece sola en la pagina, el mail y la tarjeta de WhatsApp.
 */
export function formatDrawDate(isoDate: string) {
  if (!isoDate.trim()) return "a definir";
  return formatDateArs(isoDate);
}
