/**
 * Los que siguen figurando en el padron de My Rotary.
 *
 * La importacion marca `vistoAt` en cada socio que viene en el padron del
 * dia. El que se dio de baja deja de venir y se queda con la marca vieja o
 * sin ninguna: no se borra —si tenia telefono o correo cargado, esa
 * informacion no se tira— pero deja de contar como socio.
 */
export const SOCIO_ACTUAL = { vistoAt: { not: null } } as const;
