import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminSession } from "@/lib/admin-auth";
import AddVideoForm from "./add-video-form";

export default async function AddVideoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !(await isAdminSession(user.id))) {
    redirect("/admin");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-1">Add Video</h1>
      <p className="text-sm text-gray-500 mb-8">
        Paste a YouTube URL to ingest a video.
      </p>
      <AddVideoForm />
    </div>
  );
}
