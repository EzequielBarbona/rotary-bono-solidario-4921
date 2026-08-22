/*
 * Clubes del Distrito 4921, tomados del padrón de My Rotary
 * (Mi Rotary > Distrito 4921 > Clubes) el 20/08/2026.
 *
 * Son 121: 99 clubes rotarios, 19 Rotaract y 3 satélites. Los Interact no
 * figuran en ese listado: Rotary los registra aparte, apadrinados por su
 * club, asi que no estan aca.
 *
 * Los nombres van tal cual figuran en el padron, con sus rarezas
 * ("Tandíl" con tilde y "Tandil Norte" sin ella, "Olavarria Centro"): son
 * la fuente oficial y cambiarlos nos dejaria sin poder cotejar.
 *
 * El sufijo (Rotaract) no es decorativo: hay 14 localidades con club
 * rotario y Rotaract del mismo nombre, y sin el sufijo dos clubes
 * distintos caerian en la misma fila del ranking.
 */
export const DISTRICT_CLUBS: string[] = [
  "Allen",
  "Allen (Rotaract)",
  "Antu-Trelew",
  "Argentina Pasaporte",
  "Ayacucho",
  "Ayacucho (Rotaract)",
  "Azul Centro",
  "Bahía Blanca",
  "Bahía Blanca Almafuerte (Rotaract)",
  "Bahía Blanca Norte",
  "Bahía Blanca-Almafuerte",
  "Balcarce",
  "Balcarce-Cerrito",
  "Bariloche Nuevas Generaciones",
  "Bicentenario Puerto Rosales de Punta Alta",
  "Bicentenario Segundo de Pedro Luro",
  "Bolívar",
  "Calafate Austral",
  "Caleta Olivia",
  "Caleta Olivia (Rotaract)",
  "Cinco Saltos",
  "Cipolletti",
  "Cipolletti (Rotaract)",
  "Cipolletti-Comahue",
  "Comodoro Rivadavia",
  "Comodoro Rivadavia (Rotaract)",
  "Comodoro Rivadavia Oeste",
  "Coronel Pringles",
  "Coronel Suárez",
  "Coronel Suárez (Rotaract)",
  "Coronel Vidal",
  "Costa del Este",
  "Daireaux",
  "Daireaux Huinca Loo",
  "Del Mar (Mar del Plata)",
  "Del Mar (Mar del Plata) (Rotaract)",
  "Dolores",
  "Dolores (Rotaract)",
  "Epuyén",
  "Esquel",
  "Esquel (Rotaract)",
  "Esquel Pueblo del Molino-Trévelin (satélite)",
  "General Acha",
  "General Alvear",
  "General Madariaga",
  "General Pico",
  "General Roca",
  "Golfo San Matías-San Antonio Oeste",
  "Henderson",
  "Isla Grande-Rio Grande",
  "Juárez",
  "Las Grutas",
  "Maipú",
  "Mapu de Neuquen",
  "Mar de Ajó",
  "Mar del Plata",
  "Mar del Plata (Nova)",
  "Mar del Plata Norte",
  "Mar del Plata Oeste",
  "Mar del Plata Sud",
  "María Ignacia",
  "Monte Hermoso",
  "Nahuel Huapi-Bariloche",
  "Necochea",
  "Neuquén",
  "Olavarría",
  "Olavarria Centro (Rotaract)",
  "Olavarría Norte",
  "Olavarría San Vicente",
  "Olavarría San Vicente (Rotaract)",
  "Patagonia-Gaiman",
  "Pehuajó Centro",
  "Pehuen-Co",
  "Pigüé",
  "Pinamar",
  "Puerto del Este",
  "Puerto Madryn",
  "Puerto Mar del Plata",
  "Punta Alta",
  "Punta Alta (Rotaract)",
  "Rada Tilly",
  "Rauch",
  "Rawson",
  "Río Gallegos",
  "Río Gallegos-Huauri",
  "Rio Grande",
  "San Antonio Oeste",
  "San Carlos de Bariloche",
  "San Clemente del Tuyú",
  "San Martín de los Andes",
  "Santa Rosa",
  "Santa Rosa (Rotaract)",
  "Santa Rosa Norte",
  "Santa Rosa Sur",
  "Santa Teresita",
  "Santa Teresita - General Lavalle (satélite)",
  "Santa Teresita Palermo New (satélite)",
  "Sierra Alta Tandil",
  "Sierras Bayas",
  "Tandíl",
  "Tandil (Rotaract)",
  "Tandil Norte",
  "Tandil Oeste",
  "Termas de Carhue",
  "Treinta de Agosto",
  "Trelew",
  "Trenqué Lauquén",
  "Trenque Lauquen (Rotaract)",
  "Tres Arroyos",
  "Tres Arroyos Horizonte",
  "Tres Arroyos Libertad",
  "Tres Arroyos Libertad (Rotaract)",
  "Urdampilleta",
  "Ushuaia",
  "Viedma",
  "Villa Gesell",
  "Villa Gesell (Rotaract)",
  "Villa Gesell Playa",
  "Villa Regina",
  "Villa Regina (Rotaract)",
  "Zapala",
];

/** Rotario, pero de un club de otro distrito: el bono circula por WhatsApp y eso no respeta limites. */
export const OTRO_CLUB = "Otro club de Rotary";

/** No es rotario. Suma al total recaudado, no al ranking entre clubes. */
export const SIN_CLUB = "No soy rotario";

export const hayListaDeClubes = () => DISTRICT_CLUBS.length > 0;

export const GRUPO_OTROS = "Otros distritos";
export const GRUPO_AMIGOS = "Amigos de Rotary";

/**
 * A que fila del ranking va una compra. Los clubes del 4921 compiten entre
 * si; el resto se agrupa, para que su aporte se vea sin ensuciar la tabla.
 */
export function grupoDeRanking(club: string | null): string {
  const valor = club?.trim();
  if (!valor || valor === SIN_CLUB) return GRUPO_AMIGOS;
  if (DISTRICT_CLUBS.includes(valor)) return valor;
  return GRUPO_OTROS;
}

/**
 * Cookie donde queda el club que invito a colaborar.
 *
 * Es lo que garantiza que la compra de un vecino que no es rotario se le
 * acredite al club que difundio el bono: el comprador no tiene que
 * acordarse de nada, alcanza con que haya entrado por el link del club.
 */
export const CLUB_COOKIE = "club";

/** Dos meses: el que ve el flyer hoy y compra dentro de un mes sigue sumando al mismo club. */
export const CLUB_COOKIE_MAX_AGE = 60 * 24 * 60 * 60;

/** Nombre del club convertido en algo que se pueda pegar en un flyer: "Villa Gesell (Rotaract)" -> "villa-gesell-rotaract". */
export function slugDeClub(club: string): string {
  return club
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CLUB_POR_SLUG = new Map(DISTRICT_CLUBS.map((club) => [slugDeClub(club), club]));

/** El club del padron que corresponde a un slug, o null si el link es invento. */
export function clubDeSlug(slug: string): string | null {
  return CLUB_POR_SLUG.get(slug.toLowerCase()) ?? null;
}

/**
 * Ruta de invitacion de un club, o null si ese club no esta en el padron.
 *
 * Devuelve null a proposito para "No soy rotario" y para los clubes de
 * otros distritos escritos a mano: no tienen cuenta de puntos, asi que
 * comparten el link limpio.
 */
export function rutaDeClub(club: string | null | undefined): string | null {
  const valor = club?.trim();
  if (!valor) return null;
  const slug = slugDeClub(valor);
  return CLUB_POR_SLUG.has(slug) ? `/c/${slug}` : null;
}
