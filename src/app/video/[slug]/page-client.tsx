"use client";

import { YouTubeProvider } from "./youtube-context";
import VideoPlayer from "./video-player";
import ChaptersList from "./chapters-list";
import TranscriptPanel from "./transcript-panel";
import type { Chapter, TranscriptSegment } from "@/types/schema";

interface PageClientProps {
  youtubeId: string;
  chapters: Chapter[];
  segments: TranscriptSegment[];
}

export default function PageClient({
  youtubeId,
  chapters,
  segments,
}: PageClientProps) {
  return (
    <YouTubeProvider>
      {/* Video player — embedded media at the top, like a blog header image */}
      <div className="aspect-video mb-8">
        <VideoPlayer youtubeId={youtubeId} />
      </div>

      {/* Chapter markers */}
      {chapters.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Chapters</h2>
          <ChaptersList chapters={chapters} />
        </section>
      )}

      {/* Transcript — rendered in a narrower column for comfortable reading */}
      {segments.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Transcript</h2>
          <div className="max-w-prose">
            <TranscriptPanel segments={segments} />
          </div>
        </section>
      )}
    </YouTubeProvider>
  );
}
