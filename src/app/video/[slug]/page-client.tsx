"use client";

import { YouTubeProvider } from "./youtube-context";
import VideoPlayer from "./video-player";
import ChaptersList from "./chapters-list";
import TranscriptPanel from "./transcript-panel";
import FormattedTranscript from "./formatted-transcript";
import type { Chapter, TranscriptSegment } from "@/types/schema";

interface FormattedSection {
  heading: string;
  start_time: number;
  end_time: number;
  paragraphs: string[];
}

interface PageClientProps {
  youtubeId: string;
  chapters: Chapter[];
  segments: TranscriptSegment[];
  formattedTranscript?: FormattedSection[] | null;
}

export default function PageClient({
  youtubeId,
  chapters,
  segments,
  formattedTranscript,
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

      {/* Transcript — AI-formatted sections when available, fallback to flat grouping */}
      {formattedTranscript && formattedTranscript.length > 0 ? (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Transcript</h2>
          <div className="max-w-prose">
            <FormattedTranscript sections={formattedTranscript} />
          </div>
        </section>
      ) : segments.length > 0 ? (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Transcript</h2>
          <div className="max-w-prose">
            <TranscriptPanel segments={segments} />
          </div>
        </section>
      ) : (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Transcript</h2>
          <p className="text-muted-foreground italic text-sm">
            No transcript available for this video.
          </p>
        </section>
      )}
    </YouTubeProvider>
  );
}
