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
      <div className="aspect-video mb-8">
        <VideoPlayer youtubeId={youtubeId} />
      </div>

      {chapters.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Chapters</h2>
          <ChaptersList chapters={chapters} />
        </section>
      )}

      {segments.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Transcript</h2>
          <TranscriptPanel segments={segments} />
        </section>
      )}
    </YouTubeProvider>
  );
}
