import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Chip } from "@heroui/react";
import PageClient from "./page-client";
import type { Video, Channel, Category } from "@/types/schema";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function VideoPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: video } = await supabase
    .from("videos")
    .select("*, channels(*), categories(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .single<Video & { channels: Channel | null; categories: Category | null }>();

  if (!video) notFound();

  const { data: segments } = await supabase
    .from("transcript_segments")
    .select("*")
    .eq("video_id", video.id)
    .order("order_index", { ascending: true });

  const channel = video.channels;
  const category = video.categories;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Title + metadata */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          {channel && (
            <a
              href={
                channel.url ??
                `https://youtube.com/channel/${channel.youtube_channel_id}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {channel.name}
            </a>
          )}
          {category && (
            <Chip size="sm" variant="soft">
              {category.name}
            </Chip>
          )}
          {video.difficulty && (
            <Chip
              size="sm"
              variant="soft"
              color={
                video.difficulty === "beginner"
                  ? "success"
                  : video.difficulty === "intermediate"
                    ? "warning"
                    : "danger"
              }
            >
              {video.difficulty}
            </Chip>
          )}
        </div>
      </div>

      {/* Player + Chapters + Transcript (client-side, YouTube context) */}
      <PageClient
        youtubeId={video.youtube_id}
        chapters={(video.chapters ?? []) as { title: string; start_time: number }[]}
        segments={segments ?? []}
      />

      {/* AI Summary */}
      {video.ai_summary && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Summary</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {video.ai_summary}
          </p>
        </section>
      )}

      {/* Key Takeaways */}
      {video.key_takeaways && video.key_takeaways.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Key Takeaways</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
            {video.key_takeaways.map((takeaway: string, i: number) => (
              <li key={i}>{takeaway}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Empty transcript fallback */}
      {!segments || segments.length === 0 ? (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Transcript</h2>
          <p className="text-gray-400 italic">
            No transcript available for this video.
          </p>
        </section>
      ) : null}
    </div>
  );
}
