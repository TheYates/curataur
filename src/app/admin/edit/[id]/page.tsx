import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import EditForm from "./edit-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Video — Curataur Admin" };

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVideoPage({ params }: EditPageProps) {
  // Auth check
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (session !== "authenticated") redirect("/admin");

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: video } = await supabase
    .from("videos")
    .select("*, channels(name), categories(name)")
    .eq("id", id)
    .single();

  if (!video) notFound();

  // Get all categories for the dropdown
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <a
            href="/admin/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Dashboard
          </a>
          <h1 className="text-2xl font-bold tracking-tight mt-2">Edit Video</h1>
        </div>

        <EditForm
          video={video}
          categories={categories ?? []}
        />
      </div>
    </div>
  );
}
