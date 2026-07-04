import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Video, Category } from "@/types/schema";

interface SimilarVideosProps {
  videos: (Video & { categories: Category | null })[];
}

export default function SimilarVideos({ videos }: SimilarVideosProps) {
  return (
    <div className="lg:sticky lg:top-8 space-y-4">
      <h2 className="text-lg font-semibold">You Might Also Like</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3">
        {videos.map((video) => (
          <Link
            key={video.id}
            href={`/video/${video.slug}`}
            className="group flex gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-accent/50"
          >
            {/* Thumbnail */}
            <div className="relative w-28 shrink-0 overflow-hidden rounded-md">
              <img
                src={video.thumbnail_url ?? "/placeholder-thumb.svg"}
                alt={video.title}
                className="aspect-video object-cover group-hover:scale-[1.03] transition-transform duration-200"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
                {video.title}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                {video.categories && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {video.categories.name}
                  </Badge>
                )}
                {video.duration_seconds && (
                  <span className="text-[11px] text-muted-foreground">
                    {Math.floor(video.duration_seconds / 60)}m
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
