import type { Metadata } from "next";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const revalidate = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  alternates: { canonical: siteUrl },
  openGraph: {
    url: siteUrl,
    images: [{ url: `${siteUrl}/placeholder-thumb.svg`, width: 1200, height: 630 }],
  },
  twitter: {
    images: [`${siteUrl}/placeholder-thumb.svg`],
  },
};

type VideoWithJoins = import("@/types/schema").Video & {
  channels: import("@/types/schema").Channel | null;
  categories: import("@/types/schema").Category | null;
};

export default async function HomePage() {
  const supabase = createPublicClient();

  const { data: videos } = await supabase
    .from("videos")
    .select("*, channels(*), categories(*)")
    .eq("status", "published")
    .order("added_at", { ascending: false })
    .returns<VideoWithJoins[]>();

  if (!videos || videos.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Curataur</h1>
        <p className="text-muted-foreground/70 text-lg max-w-md mx-auto">
          Curated posts with synced transcripts, AI summaries, and full-text search.
          Posts will appear here once the curator adds them.
        </p>
      </div>
    );
  }

  const [featured, ...rest] = videos;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Site header */}
      <header className="mb-16">
        <h1 className="text-4xl font-bold tracking-tight">Curataur</h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-xl">
          Curated posts with synced, clickable transcripts — search any moment
          across the full library.
        </p>
      </header>

      {/* Featured video — the latest pick, hero-style */}
      <section className="mb-16">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
          Latest Pick
        </h2>
        <Link href={`/video/${featured.slug}`} className="group block">
          <Card className="overflow-hidden border-border/60 hover:border-border hover:shadow-lg transition-all duration-200">
            <div className="relative overflow-hidden">
              <img
                src={featured.thumbnail_url ?? "/placeholder-thumb.svg"}
                alt={featured.title}
                className="w-full aspect-video object-cover group-hover:scale-[1.01] transition-transform duration-300"
              />
            </div>
            <CardContent className="p-6 sm:p-8 space-y-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold leading-tight group-hover:text-primary transition-colors">
                  {featured.title}
                </h3>
                {featured.ai_summary && (
                  <p className="text-muted-foreground leading-relaxed line-clamp-3">
                    {featured.ai_summary}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {featured.categories && (
                  <Badge variant="secondary" className="text-[11px] px-2 py-0.5">
                    {featured.categories.name}
                  </Badge>
                )}
                {featured.difficulty && (
                  <Badge
                    variant={
                      featured.difficulty === "beginner"
                        ? "default"
                        : featured.difficulty === "intermediate"
                          ? "secondary"
                          : "destructive"
                    }
                    className="text-[11px] px-2 py-0.5"
                  >
                    {featured.difficulty}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Recent videos — blog-like vertical list */}
      {rest.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
            More Posts
          </h2>
          <div className="space-y-6">
            {rest.map((video) => (
              <Link key={video.id} href={`/video/${video.slug}`} className="group block">
                <Card className="overflow-hidden border-border/50 hover:border-border hover:shadow-md transition-all duration-200">
                  <div className="flex flex-col sm:flex-row">
                    {/* Thumbnail — fixed aspect on left */}
                    <div className="sm:w-72 shrink-0 relative overflow-hidden">
                      <img
                        src={video.thumbnail_url ?? "/placeholder-thumb.svg"}
                        alt={video.title}
                        className="w-full aspect-video sm:aspect-[16/9] sm:h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    </div>
                    {/* Content — right side */}
                    <CardContent className="flex flex-col justify-center p-5 sm:p-6 min-w-0">
                      <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {video.title}
                      </h3>
                      {video.ai_summary && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                          {video.ai_summary}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-muted-foreground">
                        {video.categories && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {video.categories.name}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
