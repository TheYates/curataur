"use client";

import { useEffect } from "react";
import { YouTubeProvider } from "./youtube-context";
import VideoPlayer from "./video-player";
import ChaptersList from "./chapters-list";
import TranscriptPanel from "./transcript-panel";
import FormattedTranscript from "./formatted-transcript";
import SimilarVideos from "./similar-videos";
import type { Chapter, TranscriptSegment, Video, Category } from "@/types/schema";

interface FormattedSection {
  heading: string;
  start_time: number;
  end_time: number;
  paragraphs: string[];
}

interface PageClientProps {
  youtubeId: string;
  thumbnailUrl: string | null;
  chapters: Chapter[];
  segments: TranscriptSegment[];
  formattedTranscript?: FormattedSection[] | null;
  relatedVideos: (Video & { categories: Category | null })[];
}

export default function PageClient({
  youtubeId,
  thumbnailUrl,
  chapters,
  segments,
  formattedTranscript,
  relatedVideos,
}: PageClientProps) {
  const hasSegmentStructure =
    segments.length > 0 &&
    segments.some((s) => s.section_header || s.starts_new_paragraph);

  // Expose youtubeId on the page for transcript click handlers
  // that create visual iframe players in the document flow.
  useEffect(() => {
    document.documentElement.dataset.youtubeId = youtubeId;
  }, [youtubeId]);

  return (
    <YouTubeProvider>
      {/* Thumbnail at top of page — always visible */}
      {thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          data-thumbnail
          src={thumbnailUrl}
          alt=""
          className="rounded-lg w-full max-w-2xl mb-8 shadow-lg"
        />
      )}

      {/* Hidden YouTube player — provides seekTo() for audio/API control.
          When a word is clicked, a separate visual iframe is created above
          the paragraph in the document flow (handled by scrollVideoAbove
          in the transcript panels). */}
      <div
        data-player
        aria-hidden="true"
        className="aspect-video max-w-2xl mx-auto mb-8 shadow-lg rounded-lg overflow-hidden"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "min(672px, 100vw)",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
          maxWidth: "672px",
        }}
      >
        <VideoPlayer youtubeId={youtubeId} />
      </div>

      {/* Chapter markers */}
      {chapters.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Chapters</h2>
          <ChaptersList chapters={chapters} />
        </section>
      )}

      {/* Transcript + Similar Videos — side-by-side on large screens */}
      <div className="lg:flex lg:gap-10">
        {/* Main content — transcript */}
        <div className="flex-1 min-w-0">
          {hasSegmentStructure ? (
            <section className="mb-10">
              <div className="max-w-prose">
                <TranscriptPanel segments={segments} />
              </div>
            </section>
          ) : formattedTranscript && formattedTranscript.length > 0 ? (
            <section className="mb-10">
              <div className="max-w-prose">
                <FormattedTranscript sections={formattedTranscript} />
              </div>
            </section>
          ) : segments.length > 0 ? (
            <section className="mb-10">
              <div className="max-w-prose">
                <TranscriptPanel segments={segments} />
              </div>
            </section>
          ) : null}
        </div>

        {/* Sidebar — similar videos */}
        {relatedVideos.length > 0 && (
          <aside className="lg:w-80 shrink-0">
            <SimilarVideos videos={relatedVideos} />
          </aside>
        )}
      </div>
    </YouTubeProvider>
  );
}
