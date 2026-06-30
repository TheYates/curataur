import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VideoCard from "@/components/video-card";
import type { Video, Channel, Category } from "@/types/schema";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

type VideoWithJoins = Video & {
  channels: Channel | null;
  categories: Category | null;
};

export default async function CategoryPage({
  params,
}: CategoryPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Look up the category
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single<Category>();

  if (!category) notFound();

  // Fetch published videos in this category
  const { data: videos } = await supabase
    .from("videos")
    .select("*, channels(*), categories(*)")
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("added_at", { ascending: false })
    .returns<VideoWithJoins[]>();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{category.name}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {videos?.length ?? 0} video{(videos?.length ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>

      {!videos || videos.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No videos yet</p>
          <p className="text-sm mt-1">
            No published videos in this category yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              channel={video.channels}
              category={video.categories}
            />
          ))}
        </div>
      )}
    </div>
  );
}
