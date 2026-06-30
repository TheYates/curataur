import { Card, CardContent, CardFooter, Chip } from "@heroui/react";
import Link from "next/link";
import type { Video, Channel, Category } from "@/types/schema";

interface VideoCardProps {
  video: Video;
  channel?: Channel | null;
  category?: Category | null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function difficultyColor(difficulty: string | null) {
  switch (difficulty) {
    case "beginner":
      return "success";
    case "intermediate":
      return "warning";
    case "advanced":
      return "danger";
    default:
      return "default";
  }
}

export default function VideoCard({ video, channel, category }: VideoCardProps) {
  return (
    <Link href={`/video/${video.slug}`} className="block">
      <Card className="hover:opacity-90 transition-opacity cursor-pointer">
        <div className="relative">
          <img
            src={video.thumbnail_url ?? "/placeholder-thumb.svg"}
            alt={video.title}
            className="w-full aspect-video object-cover"
          />
          {video.duration_seconds && (
            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
              {formatDuration(video.duration_seconds)}
            </span>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>
          {channel && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {channel.name}
            </p>
          )}
        </CardContent>
        <CardFooter className="p-3 pt-0 flex gap-2 flex-wrap">
          {video.difficulty && (
            <Chip
              size="sm"
              color={difficultyColor(video.difficulty)}
              variant="soft"
            >
              {video.difficulty}
            </Chip>
          )}
          {category && (
            <Chip size="sm" variant="soft" color="accent">
              {category.name}
            </Chip>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
