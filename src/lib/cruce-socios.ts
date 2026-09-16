import { prisma } from "@/lib/prisma";

/*
 * Completa el teléfono y el correo de los socios con lo que dejaron al
 * comprar un bono.
 *
 * Quién es socio lo dice solamente My Rotary. Las compras no agregan
 * socios: solo aportan datos de contacto a socios que ya existen. Y el
 * club de una compra no prueba nada sobre la persona: mucha gente compra
 * a nombre de un club sin ser socia (el vecino que entró por el link de
 * Cipolletti), y hay socios que compraron a nombre de otro club.
 *
 * Por eso la identidad sale de la persona y no del club:
 *
 * - SEGURO: el correo o el teléfono que la persona tiene en My Rotary es
 *   el mismo que dejó en la orden. Vale para compras de cualquier club.
 * - A CONFIRMAR: mismo nombre (con apellido) en una compra del mismo club,
 *   y además el correo que dejó el comprador tiene algo de ese nombre
 *   ("rubenmombru@..." o las iniciales, "jna1010@" para Jorge Norberto
 *   Andrade). Sin ese respaldo no se completa: un homónimo que compró por
 *   el link del club, o alguien que le compró el bono a otro con su propio
 *   correo, le pegaría al socio datos que no son suyos.
 *
 * Nunca se usan datos de relleno ("nomail@nomail.com") y nunca se pisa un
 * dato ya cargado.
 */

// Títulos y sufijos que My Rotary pega al nombre: "Esc. Marcelo Pablo
// Sanchez Hijo", "Señorita Yanina Brandan".
const TITULOS = /\b(sr|sra|srta|senorita|dr|dra|lic|ing|cpn|arq|prof|esc|hijo|jr)\b\.?/g;
const PARTICULAS = new Set(["del", "las", "los"]);

const sinAcentos = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const soloDigitos = (t: string) => t.replace(/\D/g, "");

/** Las palabras del nombre, en el orden en que están escritas. */
function palabras(nombre: string) {
  return sinAcentos(nombre)
    .replace(/\([^)]*\)/g, " ")
    .replace(TITULOS, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((p) => p.length >= 3 && !PARTICULAS.has(p));
}

/**
 * Todas las palabras del nombre más corto están en el más largo (al menos
 * dos) y entre lo que comparten hay un apellido, no solo nombres de pila.
 *
 * My Rotary escribe primero los nombres: en un socio de tres palabras o
 * más, las dos primeras son nombres de pila y el resto apellidos, así
 * "Yanina Anabel Brandan Cedan" coincide con "Yanina Brandan".
 */
function mismoNombre(socio: string, comprador: string) {
  const ps = palabras(socio);
  const sa = new Set(ps);
  const sc = new Set(palabras(comprador));
  const [corto, largo] = sa.size <= sc.size ? [sa, sc] : [sc, sa];
  if (corto.size < 2) return false;
  for (const p of corto) if (!largo.has(p)) return false;
  const apellidos = ps.length >= 3 ? ps.slice(2) : ps.slice(1);
  return apellidos.some((a) => sc.has(a));
}

/** Correos que alguien tipeó para salir del paso: no son de nadie. */
const CORREO_DE_RELLENO = /(no|sin)[._-]?(tiene)?[._-]?(mail|email|correo)|ejemplo|example|^test@|prueba/i;

function correoReal(correo: string | null | undefined) {
  const c = correo?.trim().toLowerCase();
  return c && c.includes("@") && !CORREO_DE_RELLENO.test(c) ? c : null;
}

/** Últimos 8 dígitos, o null si es un número de relleno ("0000000"). */
function telefonoReal(telefono: string | null | undefined) {
  const d = soloDigitos(telefono ?? "");
  if (d.length < 8 || /^(\d)\1+$/.test(d)) return null;
  return d.slice(-8);
}

/** El correo del comprador tiene algo del nombre del socio: una palabra de 4 letras o más, o sus iniciales. */
function correoRespaldaNombre(correo: string, nombre: string) {
  const local = correo.split("@")[0].replace(/[^a-z0-9]/g, "");
  const ps = palabras(nombre);
  if (ps.some((p) => p.length >= 4 && local.includes(p))) return true;
  const iniciales = ps.map((p) => p[0]).join("");
  return iniciales.length >= 3 && local.startsWith(iniciales);
}

type Orden = {
  id: number;
  buyerName: string;
  buyerClub: string | null;
  buyerEmail: string;
  buyerPhone: string;
};

type Socio = {
  id: number;
  club: string;
  nombre: string;
  onlineId: string | null;
  email: string | null;
  telefono: string | null;
  origenContacto: string | null;
  ordenId: number | null;
};

export type Regla = "correo" | "telefono" | "nombre";

/** Con qué evidencia una orden corresponde a un socio, o null si no corresponde. */
function evidencia(s: Socio, o: Orden): Regla | null {
  const correoOrden = correoReal(o.buyerEmail);
  const telOrden = telefonoReal(o.buyerPhone);

  // Los datos del socio solo prueban identidad si vinieron de My Rotary: un
  // dato que ya se completó con una compra no puede usarse para validarse
  // a sí mismo.
  const deMyRotary = !s.origenContacto;
  const correosSocio = [correoReal(s.onlineId), deMyRotary ? correoReal(s.email) : null].filter(Boolean);
  if (correoOrden && correosSocio.includes(correoOrden)) return "correo";
  if (deMyRotary && telOrden && telefonoReal(s.telefono) === telOrden) return "telefono";

  if (
    o.buyerClub === s.club &&
    correoOrden &&
    mismoNombre(s.nombre, o.buyerName) &&
    correoRespaldaNombre(correoOrden, s.nombre)
  ) {
    return "nombre";
  }
  return null;
}

/** Identifica a la persona detrás de una orden: dos órdenes con el mismo correo y teléfono son la misma. */
const personaDeOrden = (o: Orden) => `${correoReal(o.buyerEmail) ?? ""}|${telefonoReal(o.buyerPhone) ?? ""}`;

export type ResultadoCruce = {
  revisados: number;
  completados: { socio: string; club: string; orden: number; regla: Regla }[];
  /** Datos completados antes que ya no cumplen las reglas y se sacaron. */
  retirados: { socio: string; club: string; orden: number }[];
  dudosos: { socio: string; club: string; motivo: string }[];
};

/**
 * Cruza los socios contra todas las órdenes.
 *
 * Primero revisa lo que ya se había completado con una compra y lo retira
 * si hoy no cumple las reglas, así un cambio de criterio corrige lo viejo
 * en vez de dejarlo. Después completa lo que falta. Se puede correr todas
 * las veces que haga falta.
 */
export async function cruzarSociosConOrdenes(): Promise<ResultadoCruce> {
  const socios: Socio[] = await prisma.clubSocio.findMany({
    select: {
      id: true, club: true, nombre: true, onlineId: true, email: true,
      telefono: true, origenContacto: true, ordenId: true,
    },
  });

  // Select explícito: sin él Prisma trae también la foto del comprobante
  // de cada orden, que es justo lo que agotó la base en septiembre.
  const ordenes: Orden[] = await prisma.order.findMany({
    select: { id: true, buyerName: true, buyerClub: true, buyerEmail: true, buyerPhone: true },
    orderBy: { createdAt: "desc" },
  });
  const ordenPorId = new Map(ordenes.map((o) => [o.id, o]));

  const resultado: ResultadoCruce = { revisados: 0, completados: [], retirados: [], dudosos: [] };

  // 1) Lo completado antes que hoy no se sostiene, se retira.
  for (const s of socios) {
    if (!s.origenContacto?.startsWith("orden") || !s.ordenId) continue;
    const o = ordenPorId.get(s.ordenId);
    // Para reevaluar se lo mira como vino de My Rotary: sin los datos que
    // le pegó esa misma orden.
    const original: Socio = {
      ...s,
      origenContacto: null,
      email: o && s.email === o.buyerEmail.trim() ? null : s.email,
      telefono: o && s.telefono === o.buyerPhone.trim() ? null : s.telefono,
    };
    const regla = o ? evidencia(original, o) : null;
    if (regla) {
      const origen = regla === "nombre" ? "orden-nombre" : "orden";
      if (origen !== s.origenContacto) {
        await prisma.clubSocio.update({ where: { id: s.id }, data: { origenContacto: origen } });
        s.origenContacto = origen;
      }
      continue;
    }
    await prisma.clubSocio.update({
      where: { id: s.id },
      data: { email: original.email, telefono: original.telefono, origenContacto: null, ordenId: null },
    });
    Object.assign(s, { email: original.email, telefono: original.telefono, origenContacto: null, ordenId: null });
    resultado.retirados.push({ socio: s.nombre, club: s.club, orden: o?.id ?? 0 });
  }

  // 2) Completar a quienes les falta algo.
  const pendientes = socios.filter((s) => !s.email || !s.telefono);
  resultado.revisados = pendientes.length;

  const candidatas = new Map<number, { ordenes: Orden[]; regla: Regla }>();
  for (const s of pendientes) {
    let mejor: Regla | null = null;
    let lista: Orden[] = [];
    for (const o of ordenes) {
      const r = evidencia(s, o);
      if (!r) continue;
      // Una evidencia segura manda sobre una por nombre.
      const rango = (x: Regla) => (x === "nombre" ? 1 : 0);
      if (!mejor || rango(r) < rango(mejor)) {
        mejor = r;
        lista = [o];
      } else if (rango(r) === rango(mejor)) {
        lista.push(o);
      }
    }
    if (mejor) candidatas.set(s.id, { ordenes: lista, regla: mejor });
  }

  // Un comprador que coincide con dos socios no se le asigna a ninguno.
  const sociosPorPersona = new Map<string, number>();
  for (const { ordenes: os } of candidatas.values()) {
    for (const clave of new Set(os.map(personaDeOrden))) {
      sociosPorPersona.set(clave, (sociosPorPersona.get(clave) ?? 0) + 1);
    }
  }

  for (const s of pendientes) {
    const c = candidatas.get(s.id);
    if (!c) continue;

    const personas = new Set(c.ordenes.map(personaDeOrden));
    if (personas.size > 1) {
      resultado.dudosos.push({ socio: s.nombre, club: s.club, motivo: `coincide con ${personas.size} compradores distintos` });
      continue;
    }
    const [clave] = personas;
    if ((sociosPorPersona.get(clave) ?? 0) > 1) {
      resultado.dudosos.push({ socio: s.nombre, club: s.club, motivo: "el mismo comprador coincide con más de un socio" });
      continue;
    }

    // La más reciente: si compró dos veces, los datos más nuevos.
    const orden = c.ordenes[0];
    const email = s.email ?? correoReal(orden.buyerEmail);
    const telefono = s.telefono ?? (telefonoReal(orden.buyerPhone) ? orden.buyerPhone.trim() : null);
    if (email === s.email && telefono === s.telefono) continue;

    await prisma.clubSocio.update({
      where: { id: s.id },
      data: {
        email,
        telefono,
        origenContacto: c.regla === "nombre" ? "orden-nombre" : "orden",
        ordenId: orden.id,
      },
    });
    resultado.completados.push({ socio: s.nombre, club: s.club, orden: orden.id, regla: c.regla });
  }

  return resultado;
}
