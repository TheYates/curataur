import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();

  // Static pages
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/disclosure`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // Category pages
  const { data: categories } = await supabase
    .from("categories")
    .select("slug");

  const categoryEntries: MetadataRoute.Sitemap = (categories ?? []).map(
    (cat) => ({
      url: `${siteUrl}/category/${cat.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }),
  );

  // Published video pages
  const { data: videos } = await supabase
    .from("videos")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  const videoEntries: MetadataRoute.Sitemap = (videos ?? []).map((video) => ({
    url: `${siteUrl}/video/${video.slug}`,
    lastModified: new Date(video.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...categoryEntries, ...videoEntries];
}
