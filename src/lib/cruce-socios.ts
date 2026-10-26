import { prisma } from "@/lib/prisma";
import { SOCIO_ACTUAL } from "@/lib/socios-actuales";

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
  /** Un mismo teléfono o correo en más de un socio: lo decide una persona. */
  repetidos: {
    tipo: "teléfono" | "correo";
    dato: string;
    socios: { socio: string; club: string; origen: string }[];
  }[];
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
  // Solo los que siguen en el padrón: completarle el teléfono a alguien
  // que ya se dio de baja no sirve, y encima le robaría la compra al socio
  // actual que sí es esa persona.
  const socios: Socio[] = await prisma.clubSocio.findMany({
    where: SOCIO_ACTUAL,
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

  const resultado: ResultadoCruce = { revisados: 0, completados: [], retirados: [], dudosos: [], repetidos: [] };

  // 1) Lo completado antes que hoy no se sostiene, se retira.
  /** El socio como vino de My Rotary: sin los datos que le pegó esa orden. */
  const sinLoDeLaOrden = (s: Socio, o: Orden | undefined): Socio => ({
    ...s,
    origenContacto: null,
    email: o && correoReal(s.email) === correoReal(o.buyerEmail) ? null : s.email,
    telefono: o && telefonoReal(s.telefono) === telefonoReal(o.buyerPhone) ? null : s.telefono,
  });

  /** Le saca a un socio los datos que había tomado de una compra. */
  const retirar = async (s: Socio, o: Orden | undefined) => {
    const original = sinLoDeLaOrden(s, o);
    await prisma.clubSocio.update({
      where: { id: s.id },
      data: { email: original.email, telefono: original.telefono, origenContacto: null, ordenId: null },
    });
    Object.assign(s, { email: original.email, telefono: original.telefono, origenContacto: null, ordenId: null });
    resultado.retirados.push({ socio: s.nombre, club: s.club, orden: o?.id ?? 0 });
  };

  for (const s of socios) {
    if (!s.origenContacto?.startsWith("orden") || !s.ordenId) continue;
    const o = ordenPorId.get(s.ordenId);
    const original = sinLoDeLaOrden(s, o);
    const regla = o ? evidencia(original, o) : null;
    if (regla) {
      const origen = regla === "nombre" ? "orden-nombre" : "orden";
      if (origen !== s.origenContacto) {
        await prisma.clubSocio.update({ where: { id: s.id }, data: { origenContacto: origen } });
        s.origenContacto = origen;
      }
      continue;
    }
    await retirar(s, o);
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

  /*
   * Quién se atribuye cada comprador.
   *
   * Que dos socios apunten al mismo comprador no siempre es un empate:
   *
   * - Si a uno lo respalda el correo o el teléfono y al otro solo el
   *   nombre, gana el primero. Es el caso de padre e hijo en el mismo club:
   *   la compra de "Federico Mario Ducasse" lleva el correo de Federico, y
   *   a Mario lo alcanzaba apenas porque comparten dos palabras.
   * - Si los dos socios son la misma persona en clubes distintos —en
   *   Rotary se puede— la compra es de los dos y se completa en ambos.
   */
  const rangoDe = (x: Regla) => (x === "nombre" ? 1 : 0);
  const reclamos = new Map<string, { socio: Socio; regla: Regla }[]>();

  // Los que ya tienen una compra cargada siguen reclamándola: si no, el que
  // entra por nombre se la lleva solo porque el otro ya no está pendiente.
  for (const s of socios) {
    if (!s.ordenId || !s.origenContacto?.startsWith("orden")) continue;
    const o = ordenPorId.get(s.ordenId);
    if (!o) continue;
    const clave = personaDeOrden(o);
    if (!reclamos.has(clave)) reclamos.set(clave, []);
    reclamos.get(clave)!.push({ socio: s, regla: s.origenContacto === "orden" ? "correo" : "nombre" });
  }

  for (const s of pendientes) {
    const c = candidatas.get(s.id);
    if (!c) continue;
    const personas = new Set(c.ordenes.map(personaDeOrden));
    if (personas.size > 1) continue;
    const [clave] = personas;
    if (!reclamos.has(clave)) reclamos.set(clave, []);
    reclamos.get(clave)!.push({ socio: s, regla: c.regla });
  }

  /** La misma persona anotada en dos clubes: mismo correo de acceso, o mismo nombre. */
  const esLaMisma = (a: Socio, b: Socio) => {
    const ca = correoReal(a.onlineId);
    const cb = correoReal(b.onlineId);
    if (ca && cb) return ca === cb;
    return palabras(a.nombre).join(" ") === palabras(b.nombre).join(" ");
  };

  /** Perdió contra una evidencia mejor: no es esa persona, y no hay nada que decidir. */
  const perdedores = new Set<number>();
  /** Empate entre personas distintas: no se toca y se avisa. */
  const empatados = new Set<number>();
  for (const lista of reclamos.values()) {
    if (lista.length < 2) continue;
    const mejorRango = Math.min(...lista.map((x) => rangoDe(x.regla)));
    const ganadores = lista.filter((x) => rangoDe(x.regla) === mejorRango);
    for (const x of lista) if (!ganadores.includes(x)) perdedores.add(x.socio.id);
    if (ganadores.length < 2) continue;
    // Varios ganadores: solo sirve si son la misma persona en varios clubes.
    const todosIguales = ganadores.every((x) => esLaMisma(x.socio, ganadores[0].socio));
    if (!todosIguales) for (const x of ganadores) empatados.add(x.socio.id);
  }

  for (const s of pendientes) {
    const c = candidatas.get(s.id);
    if (!c) continue;

    const personas = new Set(c.ordenes.map(personaDeOrden));
    if (personas.size > 1) {
      resultado.dudosos.push({ socio: s.nombre, club: s.club, motivo: `coincide con ${personas.size} compradores distintos` });
      continue;
    }
    if (perdedores.has(s.id)) continue;
    if (empatados.has(s.id)) {
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
    Object.assign(s, {
      email, telefono, ordenId: orden.id,
      origenContacto: c.regla === "nombre" ? "orden-nombre" : "orden",
    });
  }

  /*
   * 2b) Dos socios con los datos de la misma compra.
   *
   * Una compra es de una sola persona. Si quedaron dos pegados a la misma
   * —porque a uno lo respaldaba apenas el nombre y la revisión de arriba lo
   * mira aislado, sin saber que había otro mejor— se lo queda el que tiene
   * evidencia segura. Es el caso del padre y el hijo en el mismo club.
   * Si ninguno destaca, no se elige: se avisa.
   */
  const porOrden = new Map<number, Socio[]>();
  for (const s of socios) {
    if (!s.ordenId || !s.origenContacto?.startsWith("orden")) continue;
    if (!porOrden.has(s.ordenId)) porOrden.set(s.ordenId, []);
    porOrden.get(s.ordenId)!.push(s);
  }
  for (const [ordenId, lista] of porOrden) {
    // La misma persona en varios clubes comparte la compra con razón.
    if (lista.length < 2 || lista.every((x) => esLaMisma(x, lista[0]))) continue;
    const seguros = lista.filter((x) => x.origenContacto === "orden");
    if (seguros.length === 1) {
      for (const x of lista) if (x !== seguros[0]) await retirar(x, ordenPorId.get(ordenId));
      continue;
    }
    for (const x of lista) {
      resultado.dudosos.push({
        socio: x.nombre, club: x.club,
        motivo: `comparte los datos de la compra #${ordenId} con otro socio`,
      });
    }
  }

  /*
   * 3) Un mismo teléfono o correo en más de un socio.
   *
   * Pasa de verdad: un matrimonio del mismo club que comparte el celular,
   * o una persona que figura dos veces. No se toca nada, se avisa: elegir
   * a cuál de los dos pertenece el dato es una decisión de quien conoce a
   * la gente, no del programa.
   */
  const porDato = new Map<string, { tipo: "teléfono" | "correo"; dato: string; socios: Socio[] }>();
  for (const s of socios) {
    const claves: [("teléfono" | "correo"), string | null][] = [
      ["teléfono", telefonoReal(s.telefono)],
      ["correo", correoReal(s.email)],
    ];
    for (const [tipo, valor] of claves) {
      if (!valor) continue;
      const clave = `${tipo}:${valor}`;
      if (!porDato.has(clave)) {
        porDato.set(clave, { tipo, dato: tipo === "teléfono" ? (s.telefono ?? valor) : valor, socios: [] });
      }
      porDato.get(clave)!.socios.push(s);
    }
  }
  for (const { tipo, dato, socios: repes } of porDato.values()) {
    if (repes.length < 2) continue;
    // Una misma persona anotada en varios clubes comparte sus datos con
    // sigo misma: eso no es un dato repetido, es Rotary.
    if (repes.every((x) => esLaMisma(x, repes[0]))) continue;
    resultado.repetidos.push({
      tipo,
      dato,
      socios: repes.map((s) => ({
        socio: s.nombre,
        club: s.club,
        origen: s.origenContacto ?? "My Rotary",
      })),
    });
  }

  return resultado;
}
