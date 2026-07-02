import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { Video, Category } from "@/types/schema";

interface VideoCardProps {
  video: Video;
  category?: Category | null;
}

export default function VideoCard({ video, category }: VideoCardProps) {
  return (
    <Link href={`/video/${video.slug}`} className="group block">
      <Card className="overflow-hidden border-border/50 hover:border-border hover:shadow-md transition-all duration-200">
        <div className="relative overflow-hidden">
          <img
            src={video.thumbnail_url ?? "/placeholder-thumb.svg"}
            alt={video.title}
            className="w-full aspect-video object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold leading-snug line-clamp-2">
            {video.title}
          </h3>

          {/* Category badge only */}
          {category && (
            <div className="flex gap-2 flex-wrap pt-1">
              <Badge variant="secondary" className="text-[11px] px-2 py-0.5">
                {category.name}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
