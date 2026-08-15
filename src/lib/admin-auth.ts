import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "admin_session";

export async function isAdminAuthorized(request: Request) {
  if (!process.env.ADMIN_SECRET) return false;

  const header = request.headers.get("x-admin-secret");
  if (header === process.env.ADMIN_SECRET) return true;

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return cookieValue === process.env.ADMIN_SECRET;
}

export async function isAdminSessionActive() {
  if (!process.env.ADMIN_SECRET) return false;
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === process.env.ADMIN_SECRET;
}
