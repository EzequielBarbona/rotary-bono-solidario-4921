import { cookies } from "next/headers";
import { SLUGS } from "@/lib/campanias";

export const ADMIN_COOKIE_NAME = "admin_session";

/*
 * Quien entro al panel y que puede ver.
 *
 * Desde que hay mas de una campaña, la clave *es* la identidad: con la
 * clave de la camiseta se ven las compras de la camiseta y nada mas, y
 * con la clave maestra se ve todo. No hay usuarios ni roles que
 * administrar, que para un subcomite de voluntarios seria una cosa mas
 * que mantener.
 *
 * Lo que de verdad separa una campaña de la otra no es este login: es que
 * toda consulta al panel lleve el filtro de campania. Por eso el alcance
 * sale de aca —filtroDeCampania()— y no se arma a mano en cada pantalla.
 */

export type SesionAdmin = {
  /** La campaña que puede ver, o null si ve todas (la clave maestra). */
  campania: string | null;
};

/**
 * La variable de entorno con la clave de una campaña:
 * "camiseta-solidaria" -> ADMIN_SECRET_CAMISETA_SOLIDARIA.
 *
 * Asi agregar una campaña es agregar una variable en Vercel, sin tocar
 * este archivo. Las claves nunca van al repositorio, que es publico.
 */
const variableDe = (slug: string) =>
  `ADMIN_SECRET_${slug.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;

/** Que sesion abre una clave, o null si no abre ninguna. */
export function sesionDeClave(clave: string | null | undefined): SesionAdmin | null {
  if (!clave) return null;

  // La maestra primero: es la del distrito y ve todas las campañas.
  if (process.env.ADMIN_SECRET && clave === process.env.ADMIN_SECRET) {
    return { campania: null };
  }

  for (const slug of SLUGS) {
    const esperada = process.env[variableDe(slug)];
    if (esperada && clave === esperada) return { campania: slug };
  }

  return null;
}

/** La sesion abierta en el navegador, si hay alguna. */
export async function sesionActiva(): Promise<SesionAdmin | null> {
  const cookieStore = await cookies();
  return sesionDeClave(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

/**
 * La sesion de un pedido a la API: la cabecera para los scripts del
 * subcomite, la cookie para el panel abierto en el navegador.
 */
export async function sesionDePedido(request: Request): Promise<SesionAdmin | null> {
  const porCabecera = sesionDeClave(request.headers.get("x-admin-secret"));
  if (porCabecera) return porCabecera;
  return sesionActiva();
}

/** Si esa sesion puede ver las compras de esa campaña. */
export const puedeVer = (sesion: SesionAdmin, slug: string) =>
  sesion.campania === null || sesion.campania === slug;

/** Si es la clave maestra: la unica que ve el padron y la difusion del distrito. */
export const esMaestra = (sesion: SesionAdmin) => sesion.campania === null;

/**
 * El filtro de campaña de una sesion, para pegar en cualquier `where`.
 *
 * La maestra no filtra; una clave de campaña filtra siempre. Que salga de
 * una sola funcion es lo que evita la consulta olvidada que deja ver las
 * compras de la otra campaña.
 */
export const filtroDeCampania = (sesion: SesionAdmin) =>
  sesion.campania ? { campania: sesion.campania } : {};

/**
 * La sesion de un pedido, solo si es la maestra.
 *
 * Para lo que es del distrito y de ninguna campaña: el padron de socios,
 * las autoridades de los clubes, la difusion y el ranking entre clubes.
 * Quien administra una campaña no tiene nada que hacer ahi.
 */
export async function sesionMaestraDePedido(request: Request) {
  const sesion = await sesionDePedido(request);
  return sesion && esMaestra(sesion) ? sesion : null;
}
