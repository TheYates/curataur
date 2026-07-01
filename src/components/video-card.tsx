import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { Video, Channel, Category } from "@/types/schema";

interface VideoCardProps {
  video: Video;
  channel?: Channel | null;
  category?: Category | null;
}

function difficultyVariant(difficulty: string | null) {
  switch (difficulty) {
    case "beginner":
      return "default" as const;
    case "intermediate":
      return "secondary" as const;
    case "advanced":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export default function VideoCard({ video, channel, category }: VideoCardProps) {
  return (
    <Link href={`/video/${video.slug}`} className="block">
      <Card className="hover:opacity-90 transition-opacity cursor-pointer overflow-hidden">
        <div className="relative">
          <img
            src={video.thumbnail_url ?? "/placeholder-thumb.svg"}
            alt={video.title}
            className="w-full aspect-video object-cover"
          />
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold leading-snug line-clamp-2">{video.title}</h3>
          <div className="flex gap-2 flex-wrap">
            {video.difficulty && (
              <Badge variant={difficultyVariant(video.difficulty)}>
                {video.difficulty}
              </Badge>
            )}
            {category && (
              <Badge variant="secondary">
                {category.name}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
