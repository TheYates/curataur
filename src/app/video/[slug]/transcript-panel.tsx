"use client";

import { useMemo, useState } from "react";
import { useYouTube } from "./youtube-context";
import type { TranscriptSegment } from "@/types/schema";

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
}

export default function TranscriptPanel({ segments }: TranscriptPanelProps) {
  const { seekTo } = useYouTube();
  const [searchQuery, setSearchQuery] = useState("");

  // Build paragraphs with time metadata for click-to-seek
  const paragraphData = useMemo(() => {
    if (segments.length === 0) return [];

    const chunks: { text: string; startTime: number; endTime: number }[] = [];
    let current = segments[0].text;
    let currentStart = segments[0].start_time;
    let currentEnd = segments[0].end_time;

    for (let i = 1; i < segments.length; i++) {
      const prev = segments[i - 1];
      const curr = segments[i];
      const gap = curr.start_time - prev.end_time;

      const prevEndsSentence = /[.!?]$/.test(prev.text);
      const currentWords = current.split(/\s+/).length;

      if ((prevEndsSentence && currentWords >= 20) || gap > 2 || currentWords >= 80) {
        chunks.push({ text: current, startTime: currentStart, endTime: currentEnd });
        current = curr.text;
        currentStart = curr.start_time;
        currentEnd = curr.end_time;
      } else {
        current += " " + curr.text;
        currentEnd = curr.end_time;
      }
    }
    chunks.push({ text: current, startTime: currentStart, endTime: currentEnd });

    return chunks;
  }, [segments]);

  const handleClick = (e: React.MouseEvent) => {
    const p = (e.target as HTMLElement).closest("[data-start]");
    if (!(p instanceof HTMLElement)) return;

    const start = parseFloat(p.dataset.start || "0");
    const end = parseFloat(p.dataset.end || "0");
    const words = (p.textContent || "").split(/\s+/).filter(Boolean).length;
    if (words === 0) return;

    // Use offsetY to find approximate word position within paragraph
    const rect = p.getBoundingClientRect();
    const clickY = (e.clientY - rect.top) / rect.height;
    const clickRatio = Math.max(0, Math.min(1, clickY));
    const time = (start + (end - start) * clickRatio) / 1000;
    console.log("[Transcript] click", { start, end, clickRatio, time });
    seekTo(time);
  };

  return (
    <div>
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search within this transcript..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 rounded-lg border border-input bg-background px-4 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
          >
            Clear
          </button>
        )}
      </div>

      {paragraphData.length > 0 ? (
        <div>
          {paragraphData.map((p, pi) => (
            <p
              key={pi}
              data-start={p.startTime}
              data-end={p.endTime}
              onClick={handleClick}
              className="mb-5 text-[15px] leading-relaxed text-foreground cursor-pointer hover:opacity-90"
            >
              {searchQuery.trim() ? (
                <HighlightedText text={p.text} query={searchQuery.trim()} />
              ) : (
                p.text
              )}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground italic text-sm">
          No transcript available for this video.
        </p>
      )}
    </div>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;

  const lower = text.toLowerCase();
  const qLower = query.toLowerCase();
  const parts: { text: string; match: boolean }[] = [];
  let lastIndex = 0;

  let idx = lower.indexOf(qLower, lastIndex);
  while (idx !== -1) {
    if (idx > lastIndex) {
      parts.push({ text: text.slice(lastIndex, idx), match: false });
    }
    parts.push({ text: text.slice(idx, idx + query.length), match: true });
    lastIndex = idx + query.length;
    idx = lower.indexOf(qLower, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), match: false });
  }

  return (
    <>
      {parts.map((part, i) =>
        part.match ? (
          <span key={i} className="bg-yellow-200 dark:bg-yellow-800">
            {part.text}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}
