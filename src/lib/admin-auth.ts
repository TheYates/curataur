import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Queries the admin_users table to check if the given user ID is authorized.
 * Uses the admin client (service role) to bypass RLS.
 */
export async function isAdminSession(userId: string): Promise<boolean> {
  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return !error && !!data;
}

/**
 * Checks that the request has a valid Supabase Auth session *and* the
 * user is in the admin_users table.
 * Uses getUser() for server-verified auth (not cookie-based getSession()).
 * Returns a 401/403 response if not authorized, or null if allowed.
 *
 * Usage in API routes:
 *   const unauth = await checkAdminAuth();
 *   if (unauth) return unauth;
 */
export async function checkAdminAuth(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json(
      { error: "Unauthorized — no valid session" },
      { status: 401 },
    );
  }

  const allowed = await isAdminSession(data.user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Forbidden — user not in admin_users table" },
      { status: 403 },
    );
  }

  return null;
}
