import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import DatabaseStatsContent from "./database-stats-content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Database Stats — Curataur Admin" };

export default async function AdminDatabasePage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (session !== "authenticated") redirect("/admin");

  const supabase = createAdminClient();

  // Fetch all the data server-side
  const knownTables = [
    "videos",
    "channels",
    "categories",
    "tags",
    "video_tags",
    "transcript_segments",
    "subscribers",
  ] as const;

  const rowCounts: Record<string, number> = {};
  for (const table of knownTables) {
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    if (count !== null) rowCounts[table] = count;
  }

  let dbStats: Record<string, unknown> | null = null;
  try {
    const { data, error } = await supabase.rpc("get_db_stats");
    if (!error && data) dbStats = data as Record<string, unknown>;
  } catch {
    // RPC not created yet
  }

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

  return (
    <DatabaseStatsContent
      dbStats={dbStats}
      rowCounts={rowCounts}
      videoStats={{
        published: publishedCount ?? 0,
        drafts: draftCount ?? 0,
        total: (publishedCount ?? 0) + (draftCount ?? 0),
        transcriptSegments: transcriptCount ?? 0,
      }}
    />
  );
}
