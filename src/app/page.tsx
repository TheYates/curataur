import { createClient } from "@/lib/supabase/server";
import VideoCard from "@/components/video-card";

export const revalidate = 60;

type VideoWithJoins = import("@/types/schema").Video & {
  channels: import("@/types/schema").Channel | null;
  categories: import("@/types/schema").Category | null;
};

export default async function HomePage() {
  const supabase = await createClient();

  const { data: videos } = await supabase
    .from("videos")
    .select("*, channels(*), categories(*)")
    .eq("status", "published")
    .order("added_at", { ascending: false })
    .returns<VideoWithJoins[]>();

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <section>
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Latest Videos</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mt-3">
            Curated picks with synced transcripts, AI summaries, and full-text
            search across every video.
          </p>
        </div>

        {!videos || videos.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground/70">
            <p className="text-lg font-medium">No videos yet</p>
            <p className="text-sm mt-1">
              Videos will appear here once the curator adds them.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                category={video.categories}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
