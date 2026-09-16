import { prisma } from "@/lib/prisma";

/*
 * Completa el teléfono y el correo de los socios con lo que dejaron al
 * comprar un bono.
 *
 * My Rotary casi nunca expone esos datos, pero quien compró los escribió
 * en la orden: si Cipolletti tiene un socio "Juan Pérez" y un Juan Pérez
 * de Cipolletti compró, ese teléfono es el suyo.
 *
 * Es conservador a propósito. Un dato de contacto pegado a la persona
 * equivocada es peor que un casillero vacío: el WhatsApp le llegaría a
 * otro. Ante cualquier duda no completa y lo informa.
 */

// Títulos y sufijos que My Rotary pega al nombre: "Esc. Marcelo Pablo
// Sanchez Hijo", "Señorita Yanina Brandan".
const TITULOS = /\b(sr|sra|srta|senorita|dr|dra|lic|ing|cpn|arq|prof|esc|hijo|jr)\b\.?/g;
const PARTICULAS = new Set(["del", "las", "los"]);

/** Las palabras del nombre, en el orden en que están escritas. */
function palabras(nombre: string) {
  const limpio = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(TITULOS, " ")
    .replace(/[^a-z0-9]+/g, " ");
  return limpio.split(" ").filter((p) => p.length >= 3 && !PARTICULAS.has(p));
}

/**
 * El socio y el comprador son la misma persona si:
 *
 * - todas las palabras del nombre más corto están en el más largo, con al
 *   menos dos: "Rubén Mombrú" coincide con "Rubén Adolfo Mombrú", pero
 *   "Juan Carlos Ramos" no con "Juan Carlos Pérez", y un nombre suelto
 *   ("Silvia") no alcanza;
 * - y entre lo que comparten hay un apellido, no solo nombres de pila.
 *   Sin esto, un comprador que puso "Maria jose" se pegaba a cualquier
 *   María José Quiróz.
 *
 * My Rotary escribe primero los nombres: en un socio de tres palabras o
 * más, las dos primeras se toman como nombres de pila y el resto como
 * apellidos, así "Yanina Anabel Brandan Cedan" coincide con "Yanina
 * Brandan". El comprador puede haber puesto el apellido primero
 * ("Cardenas Gabriel"): por eso se compara contra las palabras del socio.
 */
function mismoNombre(socio: string, comprador: string) {
  const ps = palabras(socio);
  const pc = palabras(comprador);
  const sa = new Set(ps);
  const sc = new Set(pc);
  const [corto, largo] = sa.size <= sc.size ? [sa, sc] : [sc, sa];
  if (corto.size < 2) return false;
  for (const p of corto) if (!largo.has(p)) return false;

  const apellidos = ps.length >= 3 ? ps.slice(2) : ps.slice(1);
  return apellidos.some((a) => sc.has(a));
}

const soloDigitos = (t: string) => t.replace(/\D/g, "");

type Orden = {
  id: number;
  buyerName: string;
  buyerClub: string | null;
  buyerEmail: string;
  buyerPhone: string;
};

/** Identifica a la persona detrás de una orden: dos órdenes con el mismo correo y teléfono son la misma. */
const personaDeOrden = (o: Orden) =>
  `${o.buyerEmail.trim().toLowerCase()}|${soloDigitos(o.buyerPhone).slice(-8)}`;

export type ResultadoCruce = {
  revisados: number;
  completados: { socio: string; club: string; orden: number; regla: "nombre" | "correo" }[];
  dudosos: { socio: string; club: string; motivo: string }[];
};

/**
 * Cruza los socios sin teléfono o sin correo contra todas las órdenes.
 *
 * Dos reglas, en este orden:
 * - por nombre, dentro del mismo club;
 * - por correo: el usuario de My Rotary igual al correo de una orden, de
 *   cualquier club (un socio puede haber comprado invitado por otro club,
 *   y un correo no se repite entre personas).
 *
 * Solo completa casilleros vacíos: nunca pisa un dato ya cargado.
 */
export async function cruzarSociosConOrdenes(club?: string): Promise<ResultadoCruce> {
  const socios = await prisma.clubSocio.findMany({
    where: { ...(club ? { club } : {}), OR: [{ email: null }, { telefono: null }] },
    select: { id: true, club: true, nombre: true, email: true, telefono: true, onlineId: true },
  });

  const resultado: ResultadoCruce = { revisados: socios.length, completados: [], dudosos: [] };
  if (socios.length === 0) return resultado;

  // Select explícito: sin él Prisma trae también la foto del comprobante
  // de cada orden, que es justo lo que agotó la base en septiembre.
  const ordenes: Orden[] = await prisma.order.findMany({
    select: { id: true, buyerName: true, buyerClub: true, buyerEmail: true, buyerPhone: true },
    orderBy: { createdAt: "desc" },
  });

  // Primera pasada: qué órdenes le corresponden a cada socio.
  const candidatas = new Map<number, { ordenes: Orden[]; regla: "nombre" | "correo" }>();
  for (const s of socios) {
    let porNombre = ordenes.filter((o) => o.buyerClub === s.club && mismoNombre(s.nombre, o.buyerName));
    let regla: "nombre" | "correo" = "nombre";
    if (porNombre.length === 0 && s.onlineId) {
      const correo = s.onlineId.trim().toLowerCase();
      porNombre = ordenes.filter((o) => o.buyerEmail.trim().toLowerCase() === correo);
      regla = "correo";
    }
    if (porNombre.length) candidatas.set(s.id, { ordenes: porNombre, regla });
  }

  // Un comprador que coincide con dos socios ("Juan Pérez" y "Juan Carlos
  // Pérez" del mismo club) no se le asigna a ninguno.
  const sociosPorPersona = new Map<string, number>();
  for (const { ordenes: os } of candidatas.values()) {
    for (const clave of new Set(os.map(personaDeOrden))) {
      sociosPorPersona.set(clave, (sociosPorPersona.get(clave) ?? 0) + 1);
    }
  }

  for (const s of socios) {
    const c = candidatas.get(s.id);
    if (!c) continue;

    const personas = new Set(c.ordenes.map(personaDeOrden));
    if (personas.size > 1) {
      resultado.dudosos.push({
        socio: s.nombre,
        club: s.club,
        motivo: `coincide con ${personas.size} compradores distintos`,
      });
      continue;
    }
    const [clave] = personas;
    if ((sociosPorPersona.get(clave) ?? 0) > 1) {
      resultado.dudosos.push({
        socio: s.nombre,
        club: s.club,
        motivo: "el mismo comprador coincide con más de un socio",
      });
      continue;
    }

    // La más reciente: si compró dos veces, los datos más nuevos.
    const orden = c.ordenes[0];
    const email = s.email ?? (orden.buyerEmail.trim() || null);
    const telefono = s.telefono ?? (orden.buyerPhone.trim() || null);
    if (email === s.email && telefono === s.telefono) continue;

    await prisma.clubSocio.update({
      where: { id: s.id },
      data: { email, telefono, origenContacto: "orden", ordenId: orden.id },
    });
    resultado.completados.push({ socio: s.nombre, club: s.club, orden: orden.id, regla: c.regla });
  }

  return resultado;
}
