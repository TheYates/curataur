import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
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
      {/* Article header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold leading-tight mb-3">
          {video.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {channel && (
            <a
              href={
                channel.url ??
                `https://youtube.com/channel/${channel.youtube_channel_id}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              {channel.name}
            </a>
          )}
          {category && (
            <Badge variant="secondary">
              {category.name}
            </Badge>
          )}
          {video.difficulty && (
            <Badge
              variant={
                video.difficulty === "beginner"
                  ? "default"
                  : video.difficulty === "intermediate"
                    ? "secondary"
                    : "destructive"
              }
            >
              {video.difficulty}
            </Badge>
          )}
        </div>
      </header>

      {/* AI Summary — excerpt-style above the fold */}
      {video.ai_summary && (
        <section className="mb-8 max-w-prose">
          <h2 className="text-lg font-semibold mb-2">Summary</h2>
          <p className="text-muted-foreground leading-relaxed">
            {video.ai_summary}
          </p>
        </section>
      )}

      {/* Key Takeaways */}
      {video.key_takeaways && video.key_takeaways.length > 0 && (
        <section className="mb-10 max-w-prose">
          <h2 className="text-lg font-semibold mb-3">Key Takeaways</h2>
          <ul className="space-y-2">
            {video.key_takeaways.map((takeaway: string, i: number) => (
              <li key={i} className="flex gap-3 text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                <span className="leading-relaxed">{takeaway}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Player + Chapters + Transcript (client-side, YouTube context) */}
      <PageClient
        youtubeId={video.youtube_id}
        chapters={(video.chapters ?? []) as { title: string; start_time: number }[]}
        segments={segments ?? []}
        formattedTranscript={video.formatted_transcript as { heading: string; start_time: number; end_time: number; paragraphs: string[] }[] | null}
      />

      {/* Empty transcript fallback */}
      {!segments || segments.length === 0 ? (
        <section className="mb-8 max-w-prose">
          <h2 className="text-lg font-semibold mb-2">Transcript</h2>
          <p className="text-muted-foreground italic">
            No transcript available for this video.
          </p>
        </section>
      ) : null}
    </div>
  );
}
