import { toWhatsAppNumber } from "@/lib/phone";

/*
 * Una misma persona puede ocupar dos cargos en su club: presidenta y
 * Comité de la Fundación, por ejemplo. Con un botón de WhatsApp por
 * cargo recibía el material dos veces, y el panel la contaba dos veces,
 * una de ellas "sin avisar" para siempre.
 *
 * Acá se detecta quién es la misma persona dentro de cada club y se elige
 * un cargo principal: el único donde se ofrece escribirle y marcar el
 * aviso.
 */

export type ContactoComparable = {
  id: number;
  cargo: string;
  nombre: string;
  telefono: string | null;
  avisadoAt: string | null;
};

export type MarcaMismaPersona = {
  /** En un cargo repetido: el cargo principal, donde están el WhatsApp y el aviso. */
  mismaPersonaQue: { id: number; cargo: string; avisadoAt: string | null } | null;
  /** En el cargo principal: los otros cargos que ocupa la misma persona. */
  otrosCargos: string[];
};

const TITULOS = /\b(sr|sra|srta|dr|dra|lic|ing|cpn|arq|prof)\b\.?/g;
const PARTICULAS = new Set(["del", "las", "los"]);

function palabrasDelNombre(nombre: string) {
  const limpio = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    // "Natalia (Naty) Villafañe": el apodo no es parte del nombre.
    .replace(/\([^)]*\)/g, " ")
    .replace(TITULOS, " ")
    .replace(/[^a-z0-9]+/g, " ");
  return new Set(
    limpio.split(" ").filter((p) => p.length >= 3 && !PARTICULAS.has(p))
  );
}

/** Los últimos 8 dígitos sobreviven a cualquier forma de escribir +54, 9, 0 o 15. */
function colaDeTelefono(telefono: string | null) {
  const digitos = (telefono ?? "").replace(/\D/g, "");
  return digitos.length >= 8 ? digitos.slice(-8) : null;
}

export function sonLaMismaPersona(a: ContactoComparable, b: ContactoComparable) {
  const ta = colaDeTelefono(a.telefono);
  const tb = colaDeTelefono(b.telefono);
  // Con los dos teléfonos cargados deciden ellos: el mismo número es el
  // mismo chat de WhatsApp aunque el nombre esté escrito distinto ("Juna M
  // Aragon" y "Marcos Aragón"), y números distintos son personas distintas
  // aunque se llamen igual.
  if (ta && tb) return ta === tb;

  // Si falta algún teléfono, por nombre: todas las palabras del nombre más
  // corto tienen que estar en el más largo ("Belén Zárate" y "María Belén
  // Zárate"). Compartir solo algunas no alcanza: "Juan Carlos Ramos" y
  // "Juan Carlos Pérez" son dos personas.
  const pa = palabrasDelNombre(a.nombre);
  const pb = palabrasDelNombre(b.nombre);
  const [corto, largo] = pa.size <= pb.size ? [pa, pb] : [pb, pa];
  // Un nombre de una sola palabra ("Silvia") no alcanza para decidir.
  if (corto.size < 2) return false;
  for (const p of corto) if (!largo.has(p)) return false;
  return true;
}

/**
 * Marca, dentro de los contactos de un club, a la misma persona en
 * distintos cargos. Modifica y devuelve la misma lista.
 */
export function marcarMismaPersona<T extends ContactoComparable & MarcaMismaPersona>(
  contactos: T[],
  rangoDeCargo: (cargo: string) => number
): T[] {
  // Se agrupa de a pares pero por transitividad: si la misma persona
  // ocupa tres cargos, los tres quedan en un solo grupo.
  const padre = contactos.map((_, i) => i);
  const raiz = (i: number): number =>
    padre[i] === i ? i : (padre[i] = raiz(padre[i]));
  for (let i = 0; i < contactos.length; i++) {
    for (let j = i + 1; j < contactos.length; j++) {
      if (sonLaMismaPersona(contactos[i], contactos[j])) padre[raiz(i)] = raiz(j);
    }
  }

  const grupos = new Map<number, T[]>();
  contactos.forEach((c, i) => {
    const r = raiz(i);
    grupos.set(r, [...(grupos.get(r) ?? []), c]);
  });

  for (const grupo of grupos.values()) {
    if (grupo.length < 2) continue;
    // El principal es el que sirve para escribirle; entre esos, el que ya
    // tiene el aviso marcado, para no esconder esa constancia; y después
    // el cargo más alto.
    const [principal, ...repetidos] = [...grupo].sort(
      (a, b) =>
        Number(!toWhatsAppNumber(a.telefono ?? "")) -
          Number(!toWhatsAppNumber(b.telefono ?? "")) ||
        Number(!a.avisadoAt) - Number(!b.avisadoAt) ||
        rangoDeCargo(a.cargo) - rangoDeCargo(b.cargo) ||
        a.id - b.id
    );
    principal.otrosCargos = repetidos.map((c) => c.cargo);
    for (const c of repetidos) {
      c.mismaPersonaQue = {
        id: principal.id,
        cargo: principal.cargo,
        avisadoAt: principal.avisadoAt,
      };
    }
  }

  return contactos;
}
