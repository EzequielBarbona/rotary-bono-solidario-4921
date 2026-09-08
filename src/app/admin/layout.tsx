import { isAdminSessionActive } from "@/lib/admin-auth";
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
  const autorizado = await isAdminSessionActive();

  return (
    <>
      {autorizado && <NavAdmin />}
      {children}
    </>
  );
}
