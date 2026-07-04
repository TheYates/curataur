import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VideoCard from "@/components/video-card";
import type { Metadata } from "next";
import type { Video, Channel, Category } from "@/types/schema";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("slug", slug)
    .single<{ name: string; slug: string }>();

  if (!category) return {};

  const name = category.name;
  const description = `Curated ${name.toLowerCase()} videos with synced transcripts, AI summaries, and full-text search.`;

  return {
    title: `${name} Videos`,
    description,
    alternates: { canonical: `${siteUrl}/category/${category.slug}` },
    openGraph: {
      title: `${name} Videos — Curataur`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} Videos — Curataur`,
      description,
    },
  };
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
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight">
          {category.name}
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          {videos?.length ?? 0} video{(videos?.length ?? 0) !== 1 ? "s" : ""}
        </p>
        <p className="text-muted-foreground/80 mt-4 max-w-2xl leading-relaxed">
          Curated {category.name.toLowerCase()} videos with synced transcripts,
          AI summaries, and full-text search. Learn key concepts and techniques
          from expert-led content — click any word in the transcript to jump
          straight to that moment in the video.
        </p>
      </div>

      {!videos || videos.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground/70">
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
              category={video.categories}
            />
          ))}
        </div>
      )}
    </div>
  );
}
