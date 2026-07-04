import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import PageClient from "./page-client";
import type { Metadata } from "next";
import type { Video, Channel, Category } from "@/types/schema";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: video } = await supabase
    .from("videos")
    .select("title, ai_summary, thumbnail_url, slug, published_at, channels(name), categories(name)")
    .eq("slug", slug)
    .eq("status", "published")
    .single<{
      title: string;
      ai_summary: string | null;
      thumbnail_url: string | null;
      slug: string;
      published_at: string | null;
      channels: { name: string } | null;
      categories: { name: string } | null;
    }>();

  if (!video) return {};

  const description = video.ai_summary ?? video.title;

  return {
    title: video.title,
    description,
    alternates: { canonical: `${siteUrl}/video/${video.slug}` },
    openGraph: {
      title: `${video.title} — Curataur`,
      description,
      type: "article",
      publishedTime: video.published_at ?? undefined,
      images: video.thumbnail_url
        ? [{ url: video.thumbnail_url, width: 1280, height: 720 }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${video.title} — Curataur`,
      description,
      images: video.thumbnail_url ? [video.thumbnail_url] : [],
    },
    other: video.categories?.name
      ? { "article:tag": video.categories.name }
      : undefined,
  };
}

function durationToIso(seconds: number | null): string | undefined {
  if (!seconds || seconds <= 0) return undefined;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h}H`);
  if (m) parts.push(`${m}M`);
  parts.push(`${s}S`);
  return `PT${parts.join("")}`;
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

  // Fetch related videos (same category, published, exclude current)
  const { data: relatedVideos } = await supabase
    .from("videos")
    .select("*, categories(*)")
    .eq("status", "published")
    .eq("category_id", video.category_id ?? "")
    .neq("id", video.id)
    .order("added_at", { ascending: false })
    .limit(6);

  const channel = video.channels;
  const category = video.categories;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* JSON-LD Structured Data — wrapped in div so React doesn't walk script children */}
      <div
        dangerouslySetInnerHTML={{
          __html: `<script type="application/ld+json">${JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            name: video.title,
            description: video.ai_summary ?? video.title,
            thumbnailUrl: video.thumbnail_url ?? undefined,
            embedUrl: `https://www.youtube.com/embed/${video.youtube_id}`,
            uploadDate: video.published_at ?? undefined,
            duration: durationToIso(video.duration_seconds),
            ...(channel?.name
              ? { author: { "@type": "Person", name: channel.name } }
              : {}),
          })}</script>`,

        }}
      />
      <div
        dangerouslySetInnerHTML={{
          __html: `<script type="application/ld+json">${JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
              ...(category
                ? [
                    {
                      "@type": "ListItem",
                      position: 2,
                      name: category.name,
                      item: `${siteUrl}/category/${category.slug}`,
                    },
                  ]
                : []),
              {
                "@type": "ListItem",
                position: category ? 3 : 2,
                name: video.title,
              },
            ],
          })}</script>`,

        }}
      />
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

      {/* Curator's Note — EEAT signal, visible human editorial voice */}
      {video.curator_note && (
        <section className="mb-8 max-w-prose border-l-2 border-primary/40 pl-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Editor&rsquo;s Pick
          </p>
          <p className="text-sm text-muted-foreground/90 leading-relaxed italic">
            &ldquo;{video.curator_note}&rdquo;
          </p>
        </section>
      )}

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

      {/* Player + Chapters + Transcript + Related Videos (client-side) */}
      <PageClient
        youtubeId={video.youtube_id}
        thumbnailUrl={video.thumbnail_url}
        chapters={(video.chapters ?? []) as { title: string; start_time: number }[]}
        segments={segments ?? []}
        formattedTranscript={video.formatted_transcript as { heading: string; start_time: number; end_time: number; paragraphs: string[] }[] | null}
        relatedVideos={relatedVideos ?? []}
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
