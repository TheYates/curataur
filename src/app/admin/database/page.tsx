import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/admin-auth";
import DatabaseStatsContent from "./database-stats-content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Database Stats — Curataur Admin" };

export default async function AdminDatabasePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminSession(user.id))) redirect("/admin");

  const adminSupabase = createAdminClient();

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
    const { count } = await adminSupabase
      .from(table)
      .select("*", { count: "exact", head: true });
    if (count !== null) rowCounts[table] = count;
  }

  let dbStats: Record<string, unknown> | null = null;
  try {
    const { data, error } = await adminSupabase.rpc("get_db_stats");
    if (!error && data) dbStats = data as Record<string, unknown>;
  } catch {
    // RPC not created yet
  }

  const { count: publishedCount } = await adminSupabase
    .from("videos")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  const { count: draftCount } = await adminSupabase
    .from("videos")
    .select("*", { count: "exact", head: true })
    .eq("status", "draft");

  const { count: transcriptCount } = await adminSupabase
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
