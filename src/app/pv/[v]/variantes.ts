/*
 * Banco de pruebas de la tarjeta de WhatsApp.
 *
 * WhatsApp decide solo si muestra la tarjeta grande o la miniatura
 * chiquita al costado del texto, y no publica con que criterio. Con
 * 1200x630, las medidas declaradas y 143 KB —el manual de toda la vida—
 * la mostraba chica igual. Asi que en vez de seguir adivinando, cada
 * variante vive en su propia URL y se prueban todas en un chat.
 *
 * WhatsApp cachea la vista previa por URL, de ahi que sean URLs
 * distintas y no una con parametros: dos pruebas en el mismo link se
 * pisan.
 *
 * Cuando una gane, sus medidas pasan a src/app/opengraph-image.tsx y
 * esta carpeta se borra.
 */
export const VARIANTES = {
  // Lo que hay hoy, pero con la imagen terminada en .png: puede que
  // WhatsApp mire la extension para decidir si es una foto de verdad.
  a: { ancho: 1200, alto: 630, nota: "1200x630 (1.91:1) con .png" },
  // Cuadrada: la que mas alto ocupa en el chat si entra grande.
  b: { ancho: 1200, alto: 1200, nota: "1200x1200 (1:1)" },
  c: { ancho: 1200, alto: 900, nota: "1200x900 (4:3)" },
  // Mismo recorte que hoy pero al doble: por si pide un minimo de pixeles.
  d: { ancho: 2400, alto: 1260, nota: "2400x1260 (1.91:1)" },
} as const;

export type Variante = keyof typeof VARIANTES;

export function esVariante(v: string): v is Variante {
  return v in VARIANTES;
}
