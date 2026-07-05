import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/admin-auth";
import DashboardContent from "./dashboard-content";
import SignOutButton from "../sign-out-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Dashboard — Curataur" };

export default async function AdminDashboardPage() {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminSession(user.id))) redirect("/admin");

  const adminSupabase = createAdminClient();

  // Fetch all videos with joins
  const { data: videos } = await adminSupabase
    .from("videos")
    .select("*, channels(name), categories(name)")
    .order("added_at", { ascending: false });

  // Fetch categories for the dropdown
  const { data: categories } = await adminSupabase
    .from("categories")
    .select("id, name")
    .order("name");

  const publishedCount =
    videos?.filter((v) => v.status === "published").length ?? 0;
  const draftCount =
    videos?.filter((v) => v.status === "draft").length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your curated videos
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/admin/database"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Database Stats
            </a>
            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View Site →
            </a>
            <SignOutButton />
          </div>
        </div>

        <DashboardContent
          videos={videos ?? []}
          categories={categories ?? []}
          publishedCount={publishedCount}
          draftCount={draftCount}
        />
      </div>
    </div>
  );
}
