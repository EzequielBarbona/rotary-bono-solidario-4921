/**
 * Corre una consulta con un techo de tiempo y un valor de respaldo.
 *
 * La home y la pantalla de compra dibujan a partir de datos de la base.
 * Sin esto, una consulta que se cuelga deja al navegador esperando un
 * HTML que nunca llega: el visitante no ve una pagina incompleta, ve
 * "el servidor no responde". Con esto, en el peor caso se pierde un
 * numero y la pagina se muestra igual, con el boton de comprar donde
 * tiene que estar.
 *
 * No cancela la consulta: no hay forma de abortarla a mitad de camino.
 * Solo deja de esperarla.
 */
export async function conLimite<T>(
  consulta: Promise<T>,
  respaldo: T,
  ms = 8000
): Promise<T> {
  let reloj: ReturnType<typeof setTimeout> | undefined;
  const vencimiento = new Promise<typeof CADUCO>((resolve) => {
    reloj = setTimeout(() => resolve(CADUCO), ms);
  });

  try {
    const resultado = await Promise.race([consulta, vencimiento]);
    if (resultado === CADUCO) {
      console.error(`[con-limite] la consulta paso los ${ms} ms, se usa el respaldo`);
      return respaldo;
    }
    return resultado as T;
  } catch (err) {
    console.error("[con-limite] la consulta fallo, se usa el respaldo", err);
    return respaldo;
  } finally {
    clearTimeout(reloj);
  }
}

/** Centinela propio: cualquier otro valor podria ser un resultado valido. */
const CADUCO = Symbol("caduco");
