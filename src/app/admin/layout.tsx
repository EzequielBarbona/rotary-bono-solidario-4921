import { sesionActiva } from "@/lib/admin-auth";
import { campaniaDeSlug } from "@/lib/campanias";
import { NavAdmin } from "@/components/admin/NavAdmin";

/**
 * La barra de secciones, comun a todo el panel.
 *
 * Va en el layout y no en cada pagina para que sea una sola: cuando
 * vivia repetida en los cuatro archivos, cada pantalla ofrecia links
 * distintos segun quien la habia tocado ultimo.
 *
 * Solo se dibuja con sesion abierta. Sin ella cada pagina muestra el
 * formulario de ingreso, y una barra de navegacion arriba de un login
 * es una invitacion a hacer clic para nada.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const sesion = await sesionActiva();
  const campania = sesion?.campania ? campaniaDeSlug(sesion.campania) : null;

  return (
    <>
      {sesion && <NavAdmin campania={campania?.nombreCorto ?? null} />}
      {children}
    </>
  );
}
