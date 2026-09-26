import { raffleConfig } from "@/lib/config";
import { clubDeSlug, slugDeClub } from "@/lib/clubs";
import { responderConVolante } from "@/lib/volante";

/*
 * El volante de un club, con el QR de su link.
 *
 * El club lo imprime y lo pega donde quiera: quien escanea el QR entra por
 * el link de ese club, asi que la venta le queda acreditada aunque el que
 * compra no sea rotario y no sepa nada de la copa.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const club = clubDeSlug(slug);
  if (!club) {
    return new Response("No existe ese club.", { status: 404 });
  }

  return responderConVolante(request, {
    enlace: `${raffleConfig.siteUrl}/c/${slugDeClub(club)}`,
    club,
    archivo: `bono-polioplus-${slugDeClub(club)}`,
  });
}
