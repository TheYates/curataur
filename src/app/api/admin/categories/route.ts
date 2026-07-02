import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET() {
  const unauth = await checkAdminAuth();
  if (unauth) return unauth;

  const supabase = createAdminClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories });
}
