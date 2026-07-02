import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET() {
  const unauth = await checkAdminAuth();
  if (unauth) return unauth;

  const supabase = createAdminClient();

  const { data: videos, error } = await supabase
    .from("videos")
    .select("*, channels(name), categories(name)")
    .order("added_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ videos });
}
