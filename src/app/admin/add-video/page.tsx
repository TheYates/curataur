import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AddVideoForm from "./add-video-form";

export default async function AddVideoPage() {
  const cookieStore = await cookies();
  const isAuthenticated =
    cookieStore.get("admin_session")?.value === "authenticated";

  if (!isAuthenticated) {
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
