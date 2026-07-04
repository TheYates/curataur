import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdminAuth } from "@/lib/admin-auth";
// AI generation is temporarily disabled (Gemini quota exhausted, Groq request too large)

// ─── Helpers ───────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ─── POST ──────────────────────────────────────────────────

export async function POST(request: Request) {
  const unauth = await checkAdminAuth();
  if (unauth) return unauth;

  try {
    const { url, categoryName } = await request.json();

    // 1. Extract video ID
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL. Please provide a valid URL." },
        { status: 400 },
      );
    }

    // 2. Fetch metadata from YouTube Data API v3
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "YouTube API key not configured." },
        { status: 500 },
      );
    }

    const metaUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;
    const metaRes = await fetch(metaUrl);

    if (!metaRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch video metadata from YouTube." },
        { status: 502 },
      );
    }

    const metaJson = await metaRes.json();
    const item = metaJson?.items?.[0];

    if (!item) {
      return NextResponse.json(
        { error: "Video not found on YouTube." },
        { status: 404 },
      );
    }

    const snippet = item.snippet;
    const contentDetails = item.contentDetails;

    // Parse ISO 8601 duration
    const durationMatch = contentDetails.duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = parseInt(durationMatch?.[1] ?? "0", 10) || 0;
    const minutes = parseInt(durationMatch?.[2] ?? "0", 10) || 0;
    const seconds = parseInt(durationMatch?.[3] ?? "0", 10) || 0;
    const durationSeconds = hours * 3600 + minutes * 60 + seconds;

    const youtubeChannelId = snippet.channelId;

    // 3. Upsert channel
    const supabase = createAdminClient();

    const { data: channel } = await supabase
      .from("channels")
      .upsert(
        {
          youtube_channel_id: youtubeChannelId,
          name: snippet.channelTitle,
          url: `https://www.youtube.com/channel/${youtubeChannelId}`,
        },
        { onConflict: "youtube_channel_id" },
      )
      .select("id")
      .single();

    // 4. Upsert category (ad hoc)
    let categoryId: string | null = null;
    if (categoryName?.trim()) {
      const catSlug = slugify(categoryName);
      const { data: category } = await supabase
        .from("categories")
        .upsert(
          { name: categoryName.trim(), slug: catSlug },
          { onConflict: "name" },
        )
        .select("id")
        .single();
      categoryId = category?.id ?? null;
    }

    // 5. Insert video (draft initially)
    const title = snippet.title;
    const slug = slugify(title) + "-" + videoId.slice(0, 6);
    const thumbnailUrl =
      snippet.thumbnails?.maxres?.url ??
      snippet.thumbnails?.high?.url ??
      snippet.thumbnails?.medium?.url ??
      null;

    const { data: video, error: videoError } = await supabase
      .from("videos")
      .upsert(
        {
          youtube_id: videoId,
          channel_id: channel?.id ?? null,
          category_id: categoryId,
          slug,
          title,
          thumbnail_url: thumbnailUrl,
          duration_seconds: durationSeconds,
          published_at: snippet.publishedAt,
          status: "draft",
        },
        { onConflict: "youtube_id" },
      )
      .select("id")
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: "Failed to save video to database." },
        { status: 500 },
      );
    }

    // 6. Fetch transcript
    let transcript: { text: string; offset: number; duration: number }[] = [];

    try {
      const { YoutubeTranscript } = await import("youtube-transcript");
      transcript = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (err) {
      console.error("Failed to fetch transcript for video", videoId, ":", err);
      // Transcript not available — continue without it
    }

    // 7. Insert transcript segments
    if (transcript.length > 0) {
      const segments = transcript.map((seg, i) => ({
        video_id: video.id,
        start_time: seg.offset,
        end_time: seg.offset + seg.duration,
        text: seg.text,
        order_index: i,
      }));

      const { error: segError } = await supabase
        .from("transcript_segments")
        .insert(segments);

      if (segError) {
        console.error("Failed to insert transcript segments:", segError);
      }
    }

    // AI generation is temporarily disabled (Gemini quota exhausted, Groq request too large)

    // 9. Refresh full-text search (keep as draft — publish from dashboard)
    await supabase.rpc("refresh_video_search", {
      p_video_id: video.id,
    });

    return NextResponse.json({
      success: true,
      title,
      slug,
      videoId: video.id,
    });
  } catch (err) {
    console.error("Ingestion error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during ingestion." },
      { status: 500 },
    );
  }
}
