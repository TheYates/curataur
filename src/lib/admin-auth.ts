import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Checks the admin_session cookie and returns a 401 response if not authenticated.
 * Returns null if authenticated, so callers can do:
 *   const unauth = await checkAdminAuth();
 *   if (unauth) return unauth;
 */
export async function checkAdminAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (session !== "authenticated") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }
  return null;
}
