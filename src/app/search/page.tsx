import { createClient } from "@/lib/supabase/server";
import VideoCard from "@/components/video-card";
import SearchInput from "./search-input";
import type { Video, Channel, Category } from "@/types/schema";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

type VideoWithJoins = Video & {
  channels: Channel | null;
  categories: Category | null;
};

export const revalidate = 0;

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const supabase = await createClient();

  let videos: VideoWithJoins[] = [];

  if (query.length > 0) {
    // Use Supabase's full-text search on the search_vector column
    const { data } = await supabase
      .from("videos")
      .select("*, channels(*), categories(*)")
      .textSearch("search_vector", query, {
        config: "english",
      } as never)
      .eq("status", "published")
      .order("added_at", { ascending: false })
      .returns<VideoWithJoins[]>();

    videos = data ?? [];
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Search</h1>

      <SearchInput initialQuery={query} />

      {query && (
        <div className="mt-8">
          {videos.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground/70">
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm mt-1">
                No videos matched{" "}
                <span className="font-medium text-foreground/60">
                  &ldquo;{query}&rdquo;
                </span>
                . Try a different search term.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {videos.length} result{videos.length !== 1 ? "s" : ""} for{" "}
                <span className="font-medium text-foreground/60">&ldquo;{query}&rdquo;</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    category={video.categories}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!query && (
        <div className="text-center py-16 text-muted-foreground/70">
          <p className="text-sm">
            Search across every video&rsquo;s full transcript.
          </p>
        </div>
      )}
    </div>
  );
}
