/*
 * Banco de pruebas de la tarjeta de WhatsApp.
 *
 * WhatsApp decide solo si muestra la tarjeta grande o la miniatura
 * chiquita al costado del texto, y no publica con que criterio. Asi que en
 * vez de adivinar, cada variante vive en su propia URL y se prueban todas
 * en un chat.
 *
 * WhatsApp cachea la vista previa por URL, de ahi que sean URLs distintas
 * y no una con parametros: dos pruebas en el mismo link se pisan.
 *
 * Lo que fue saliendo (22/10/2026, WhatsApp de escritorio 2.2641):
 * - a, b, c, d: ni la proporcion ni la cantidad de pixeles cambian nada.
 * - La Nacion y YouTube, de control, salen igual de compactas. Con una
 *   imagen de 480x360, encima. O sea que el formato compacto es del
 *   cliente y no de nuestra pagina.
 * - Lo unico que cambia de verdad es el recorte: el compacto recorta un
 *   cuadrado del centro, asi que una pieza cuadrada se ve entera.
 *
 * Cuando una gane, sus medidas pasan a src/app/opengraph-image.tsx y esta
 * carpeta se borra.
 */
export const VARIANTES = {
  // Lo que habia, pero con la imagen terminada en .png: puede que
  // WhatsApp mire la extension para decidir si es una foto de verdad.
  a: { ancho: 1200, alto: 630, nota: "1200x630 (1.91:1) con .png" },
  b: { ancho: 1200, alto: 1200, nota: "1200x1200 (1:1)" },
  c: { ancho: 1200, alto: 900, nota: "1200x900 (4:3)" },
  // Mismo recorte que antes pero al doble: por si pide un minimo de pixeles.
  d: { ancho: 2400, alto: 1260, nota: "2400x1260 (1.91:1)" },
  // La cuadrada otra vez, ya con el dibujo que llena el cuadro. URL nueva
  // porque WhatsApp se quedo con la vista previa vieja de /pv/b.
  e: { ancho: 1200, alto: 1200, nota: "1200x1200 (1:1) rearmada" },
  // Sin descripcion: si la tarjeta la arma el texto, sin el tendria que
  // cambiar de forma.
  f: { ancho: 1200, alto: 1200, nota: "1:1 sin descripción", sinDescripcion: true },
  // Con la imagen resumida: el gancho, la cuenta y el cierre al triple de
  // tamaño, porque en una miniatura de 96 px no se lee nada mas.
  g: { ancho: 1200, alto: 1200, nota: "1:1 resumida", resumida: true },
} as const;

export type Variante = keyof typeof VARIANTES;

export function esVariante(v: string): v is Variante {
  return v in VARIANTES;
}

/** Los datos de una variante, con los dos interruptores siempre definidos. */
export function datosDeVariante(v: Variante) {
  const d: {
    ancho: number;
    alto: number;
    nota: string;
    sinDescripcion?: boolean;
    resumida?: boolean;
  } = VARIANTES[v];
  return {
    ancho: d.ancho,
    alto: d.alto,
    nota: d.nota,
    sinDescripcion: d.sinDescripcion ?? false,
    resumida: d.resumida ?? false,
  };
}
