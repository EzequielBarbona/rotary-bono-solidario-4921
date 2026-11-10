/*
 * Las campañas de bonos que vivieron o viven en este sitio.
 *
 * Hasta ahora el sitio era una sola campaña: el Bono Solidario PolioPlus
 * del Distrito 4921, con sus datos en variables de entorno. Al aparecer
 * la segunda —la camiseta de Rotary Neuquen con Moiru— la raiz pasa a ser
 * una portada que las lista, y cada campaña tiene su propia pagina.
 *
 * Esto es nada mas el indice: lo que la portada necesita para dibujar las
 * tarjetas. Los numeros vendidos salen de la base, y el flujo de compra
 * de cada campaña sigue siendo el mismo de siempre.
 *
 * Lo decidido para la campaña de la camiseta (9/11/2026):
 *
 * - Venta directa: no se le acredita a ningun club ni vendedor, asi que
 *   su formulario de compra no lleva el campo del club.
 * - Panel aparte: cada campaña tiene su propia clave y quien entra ve
 *   solo sus compradores. Los datos del PolioPlus no quedan al alcance
 *   de quien administra la camiseta, ni al reves.
 * - Sorteo por las 3 ultimas cifras de la Loteria de la Ciudad de
 *   Buenos Aires, de ahi que los numeros vayan del 000 al 999.
 */

import { raffleConfig } from "@/lib/config";

export type EstadoCampania = "abierta" | "proxima" | "cerrada";

/**
 * Que documento se le pide a quien compra.
 *
 * El dato existe para cruzar la transferencia con la compra cuando hay
 * varios pagos parecidos el mismo dia. El PolioPlus pidio CUIT/CUIL
 * porque es lo que muestra el comprobante del banco; para la camiseta se
 * pide el DNI, que todo el mundo sabe de memoria y es un campo menos
 * donde trabarse antes de pagar.
 */
export type TipoDocumento = "cuit" | "dni";

export type Documento = {
  /** Como se lo nombra en el panel y en la planilla. */
  etiqueta: string;
  /** Lo que dice el campo del formulario. */
  pedido: string;
  /** Cuantas cifras tiene, sin puntos ni guiones. */
  minimo: number;
  maximo: number;
  /** Que se le contesta a quien escribe cualquier cosa. */
  error: string;
  /** Por que se lo pedimos, para la ayuda del formulario. */
  porQue: string;
};

export const DOCUMENTOS: Record<TipoDocumento, Documento> = {
  cuit: {
    etiqueta: "CUIT/CUIL",
    pedido: "CUIT / CUIL con el que transferís",
    minimo: 11,
    maximo: 11,
    error: "El CUIT/CUIL debe tener 11 números.",
    porQue:
      "las transferencias bancarias muestran el CUIT de quien las hace, así que lo usamos para cruzar tu pago con tu compra más rápido y con más seguridad, sobre todo si hay varias compras con montos parecidos el mismo día.",
  },
  dni: {
    etiqueta: "DNI",
    pedido: "DNI de quien transfiere",
    // Sin puntos: 7 cifras los documentos viejos, 8 los de ahora.
    minimo: 7,
    maximo: 8,
    error: "El DNI tiene que tener 7 u 8 números, sin puntos.",
    porQue:
      "lo usamos para cruzar tu pago con tu compra más rápido y con más seguridad, sobre todo si hay varias compras con montos parecidos el mismo día.",
  },
};

export type Institucion = {
  nombre: string;
  logo: string;
  /** Proporciones del archivo, para que Next no tenga que adivinarlas. */
  ancho: number;
  alto: number;
};

export type Cuenta = {
  titular: string;
  cbu: string;
  alias: string;
  cuit?: string;
  /** El numero de cuenta tal cual lo imprime el banco. */
  numero?: string;
};

export type Campania = {
  slug: string;
  /** La ruta de su pagina. */
  ruta: string;
  titulo: string;
  /** Dos o tres palabras, para las pestañas del panel y los avisos. */
  nombreCorto: string;
  /** Una linea, la que se lee en la tarjeta debajo del titulo. */
  bajada: string;
  instituciones: Institucion[];
  premio: string;
  /**
   * La letra chica del premio: talle, fechas, condiciones.
   *
   * Va aparte y no pegada al premio porque el premio se dibuja en cuerpo
   * grande en la tarjeta de WhatsApp, y ahi una sola linea de mas lo tira
   * todo abajo. Esto se muestra chico, al lado o debajo.
   */
  premioDetalle?: string;
  precioArs: number;
  /** Que documento se le pide al comprador: ver DOCUMENTOS. */
  documento: TipoDocumento;
  /**
   * Si el formulario pregunta que club invito al comprador.
   *
   * El PolioPlus lo pregunta porque lo vendian los 119 clubes del
   * distrito y el ranking reparte el merito. La camiseta es venta
   * directa: no hay a quien acreditarle nada y el campo solo seria una
   * pregunta mas antes de pagar.
   */
  pideClub: boolean;
  totalNumeros: number;
  /**
   * Como se escribe un numero: "0000" a "0999" o "0001" a "1000". El
   * PolioPlus numero del 1 al 1000; la camiseta va del 000 al 999.
   */
  primerNumero: number;
  digitos: number;
  /** Cuando cierra la venta, en ISO con huso argentino. Null: a confirmar. */
  cierreAt: string | null;
  /** Texto del sorteo tal cual se anuncia. Null mientras no este definido. */
  sorteo: string | null;
  /**
   * El WhatsApp al que escribe el comprador que se traba.
   *
   * Es por campaña y no del sitio: al que compra la camiseta lo atiende
   * Rotary Neuquen, no el subcomite del PolioPlus. Un numero equivocado en
   * el pie es peor que ninguno, porque el comprador escribe y nadie
   * contesta.
   */
  soporte: {
    /** Solo digitos, como lo quiere wa.me. */
    wa: string;
    /** El mismo numero como se lee en pantalla. */
    texto: string;
  };
  /**
   * La cuenta donde se transfiere.
   *
   * No es un secreto y por eso vive aca y no en una variable de entorno:
   * es justo lo contrario, el dato que el comprador tiene que poder
   * copiar de la pantalla. Cada campaña cobra en la suya.
   */
  cuenta: Cuenta;
  /**
   * Si la campaña ya se puede visitar. Una campaña sin publicar aparece en
   * la portada como "proximamente" y no lleva a ningun lado: sirve para
   * anunciarla mientras se terminan de definir fecha y premio.
   */
  publicada: boolean;
  /** Los colores con los que se dibuja su tarjeta. */
  paleta: {
    /** Fondo de la tarjeta, en CSS: admite degradados. */
    fondo: string;
    /** Color del texto sobre ese fondo. */
    texto: string;
    /** El acento que usan el precio y el boton. */
    acento: string;
    /** Texto sobre el acento. */
    acentoTexto: string;
  };
};

const ROTARY: Institucion = {
  nombre: "Rotary Club de Neuquén",
  logo: "/brand/rotary-neuquen.png",
  ancho: 640,
  alto: 288,
};

const MOIRU: Institucion = {
  nombre: "Asociación Moiru",
  logo: "/brand/moiru.png",
  ancho: 640,
  alto: 181,
};

const DISTRITO: Institucion = {
  nombre: "Distrito Rotary 4921",
  logo: "/brand/rotary-endpolio-lockup-color.png",
  ancho: 640,
  alto: 286,
};

export const CAMPANIAS: Campania[] = [
  {
    slug: "camiseta-solidaria",
    ruta: "/camiseta-solidaria",
    titulo: "Dos instituciones. Una comunidad. Un mismo compromiso: ayudar.",
    nombreCorto: "Camiseta solidaria",
    bajada: "Una camiseta, muchas causas, un mismo compromiso.",
    instituciones: [ROTARY, MOIRU],
    cuenta: {
      titular: "ROTARY CLUB DE NEUQUEN AC",
      cuit: "30-70984647-3",
      numero: "CC$ 191-093-065718/1",
      cbu: "19100933-55009306571814",
      alias: "rotarydeneuquen",
    },
    premio: "Camiseta del Club Cipolletti firmada por los jugadores",
    premioDetalle: "Talle S",
    precioArs: 2000,
    documento: "dni",
    pideClub: false,
    totalNumeros: 1000,
    primerNumero: 0,
    digitos: 3,
    cierreAt: null,
    // Los 1.000 numeros van del 000 al 999 porque el sorteo son las tres
    // ultimas cifras: la fecha todavia no esta, el mecanismo si.
    sorteo:
      "Por las 3 últimas cifras de la Lotería de la Ciudad de Buenos Aires · fecha a confirmar",
    soporte: { wa: "5492995837763", texto: "+54 9 299 583-7763" },
    publicada: true,
    paleta: {
      // El azul de Rotary abre y el rosa de Moiru cierra: las dos marcas
      // en una sola pieza, sin que ninguna quede de adorno.
      fondo: "linear-gradient(135deg, #17458F 0%, #7268AC 55%, #EC2E80 100%)",
      texto: "#FFFFFF",
      acento: "#FBB03B",
      acentoTexto: "#17458F",
    },
  },
  {
    slug: "polioplus",
    ruta: "/polioplus",
    titulo: "Bono Solidario PolioPlus",
    nombreCorto: "PolioPlus",
    bajada:
      "Mantengamos la esperanza de un mundo libre de polio. Campaña del Distrito 4921.",
    instituciones: [DISTRITO],
    // La cuenta del PolioPlus sigue en las variables de entorno de
    // siempre: la campaña ya cerro y no tiene sentido mudarla.
    cuenta: {
      titular: raffleConfig.bankAccountHolder,
      cbu: raffleConfig.bankCbu,
      alias: raffleConfig.bankAlias,
    },
    premio: "5 noches para 2 personas en Bariloche o Las Grutas",
    precioArs: 10000,
    documento: "cuit",
    pideClub: true,
    totalNumeros: 1000,
    primerNumero: 1,
    digitos: 4,
    cierreAt: "2026-10-24T18:00:00-03:00",
    sorteo: "Sorteada el 24 de octubre de 2026 por la Lotería Nacional",
    soporte: { wa: "5492994736968", texto: "+54 9 299 4736968" },
    publicada: true,
    paleta: {
      fondo: "linear-gradient(135deg, #0067C8 0%, #17458F 100%)",
      texto: "#FFFFFF",
      acento: "#F7A81B",
      acentoTexto: "#17458F",
    },
  },
];

export function estadoDe(campania: Campania, ahora = Date.now()): EstadoCampania {
  if (!campania.publicada) return "proxima";
  if (!campania.cierreAt) return "abierta";
  const cierre = new Date(campania.cierreAt).getTime();
  if (Number.isNaN(cierre)) return "abierta";
  return ahora >= cierre ? "cerrada" : "abierta";
}

/** "0999", "0001". El relleno con ceros lo fija cada campaña. */
export const formatNumero = (campania: Campania, numero: number) =>
  String(numero).padStart(campania.digitos, "0");

/** El primero y el ultimo, para anunciar el rango: "000 al 999". */
export function rangoDe(campania: Campania) {
  const ultimo = campania.primerNumero + campania.totalNumeros - 1;
  return `${formatNumero(campania, campania.primerNumero)} al ${formatNumero(campania, ultimo)}`;
}

export const campaniaDeSlug = (slug: string) =>
  CAMPANIAS.find((c) => c.slug === slug) ?? null;

export const ETIQUETA_ESTADO: Record<EstadoCampania, string> = {
  abierta: "Venta abierta",
  proxima: "Próximamente",
  cerrada: "Venta cerrada",
};

/** Los slugs tal cual se guardan en la base, para validar lo que llega. */
export const SLUGS = CAMPANIAS.map((c) => c.slug);

/**
 * La campaña del PolioPlus, la primera.
 *
 * Varias piezas son suyas y de nadie mas —el volante impreso, la tarjeta
 * de WhatsApp, el ranking de clubes— y necesitan nombrarla sin buscarla.
 */
export const POLIOPLUS = campaniaDeSlugOExplota("polioplus");

function campaniaDeSlugOExplota(slug: string): Campania {
  const c = CAMPANIAS.find((x) => x.slug === slug);
  // Si alguien renombra un slug, que falle al arrancar y no en silencio
  // adentro de una consulta.
  if (!c) throw new Error(`No hay campaña con slug "${slug}".`);
  return c;
}

/** El ultimo numero de la campaña: 1000 en el PolioPlus, 999 en la camiseta. */
export const ultimoNumero = (campania: Campania) =>
  campania.primerNumero + campania.totalNumeros - 1;

/** Si un numero cae dentro del rango de la campaña. */
export const numeroValido = (campania: Campania, numero: number) =>
  Number.isInteger(numero) &&
  numero >= campania.primerNumero &&
  numero <= ultimoNumero(campania);

/** El primer paso de la compra de esta campaña. */
export const rutaDeCompra = (campania: Campania) => `/comprar/${campania.slug}/cantidad`;

/**
 * De que campaña es una ruta del sitio: su home o cualquier paso de su
 * compra. Null en la portada y en el panel, que no son de ninguna.
 */
export function campaniaDeRuta(pathname: string | null | undefined): Campania | null {
  if (!pathname) return null;
  return (
    CAMPANIAS.find(
      (c) => pathname === c.ruta || pathname.startsWith(`/comprar/${c.slug}`)
    ) ?? null
  );
}

/**
 * A quien escribe el que necesita ayuda en esta pantalla.
 *
 * En la pantalla de una campaña, a esa campaña. En la portada y en la
 * pantalla de una orden, donde no se sabe de cual se trata, a la que
 * tenga la venta abierta: es de donde van a venir los problemas de hoy.
 */
export function soporteDeRuta(pathname: string | null | undefined) {
  const propia = campaniaDeRuta(pathname);
  if (propia) return propia.soporte;
  const abierta = CAMPANIAS.find((c) => estadoDe(c) === "abierta");
  return (abierta ?? POLIOPLUS).soporte;
}
