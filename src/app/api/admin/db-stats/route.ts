import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/admin-auth";

const KNOWN_TABLES = [
  "videos",
  "channels",
  "categories",
  "tags",
  "video_tags",
  "transcript_segments",
  "subscribers",
] as const;

export async function GET() {
  const unauth = await checkAdminAuth();
  if (unauth) return unauth;

  const supabase = createAdminClient();

  // Always try to fetch row counts directly as a baseline
  const rowCounts: Record<string, number> = {};
  for (const table of KNOWN_TABLES) {
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    if (count !== null) rowCounts[table] = count;
  }

  // Try the RPC for DB size stats (works only if the function exists)
  let dbStats: Record<string, unknown> | null = null;
  try {
    const { data, error } = await supabase.rpc("get_db_stats");
    if (!error && data) dbStats = data as Record<string, unknown>;
  } catch {
    // RPC not created yet — that's fine, fall back to just row counts
  }

  // Video-specific stats
  const { count: publishedCount } = await supabase
    .from("videos")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  const { count: draftCount } = await supabase
    .from("videos")
    .select("*", { count: "exact", head: true })
    .eq("status", "draft");

  const { count: transcriptCount } = await supabase
    .from("transcript_segments")
    .select("*", { count: "exact", head: true });

  return NextResponse.json({
    dbStats,
    rowCounts,
    videoStats: {
      published: publishedCount ?? 0,
      drafts: draftCount ?? 0,
      total: (publishedCount ?? 0) + (draftCount ?? 0),
      transcriptSegments: transcriptCount ?? 0,
    },
  });
}
