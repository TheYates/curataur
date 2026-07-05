import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/auth — check if there's a valid session
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return NextResponse.json({ authenticated: !!session });
}

/**
 * POST /api/admin/auth — no longer used (Supabase handles login via magic link)
 */
export async function POST() {
  return NextResponse.json(
    { error: "Use Supabase Auth directly via the browser client." },
    { status: 410 },
  );
}

/**
 * DELETE /api/admin/auth — sign out
 */
export async function DELETE() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
