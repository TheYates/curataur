import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createClient();

  const { data } = await supabase
    .from("videos")
    .select("id, title, slug, thumbnail_url, duration_seconds, channels(name), categories(name)")
    .textSearch("search_vector", query, { config: "english" } as never)
    .eq("status", "published")
    .order("added_at", { ascending: false })
    .limit(10);

  return NextResponse.json({ results: data ?? [] });
}
