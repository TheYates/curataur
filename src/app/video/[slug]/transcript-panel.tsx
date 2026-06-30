"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useYouTube } from "./youtube-context";
import type { TranscriptSegment } from "@/types/schema";

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
}

interface WordSpan {
  text: string;
  time: number;
  element: HTMLSpanElement | null;
}

export default function TranscriptPanel({ segments }: TranscriptPanelProps) {
  const { seekTo } = useYouTube();
  const containerRef = useRef<HTMLDivElement>(null);
  const allWordsRef = useRef<WordSpan[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeTime, setActiveTime] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Build word-level data from segments on mount
  useEffect(() => {
    const words: WordSpan[] = [];
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    segments.forEach((seg) => {
      const p = document.createElement("p");
      p.className = "mb-3 leading-relaxed";
      const tokens = seg.text.split(/\s+/);
      const step = tokens.length > 1 ? (seg.end_time - seg.start_time) / tokens.length : 0;

      tokens.forEach((token, i) => {
        const span = document.createElement("span");
        span.className =
          "word rounded-sm px-0.5 cursor-pointer hover:underline";
        span.textContent = token + (i < tokens.length - 1 ? " " : "");
        const time = seg.start_time + i * step;
        span.dataset.time = time.toFixed(2);
        p.appendChild(span);

        words.push({ text: token, time, element: span });
      });

      container.appendChild(p);
    });

    allWordsRef.current = words;
  }, [segments]);

  // Click handler — seek to word time
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".word") as HTMLSpanElement | null;
      if (target?.dataset.time) {
        seekTo(parseFloat(target.dataset.time));
      }
    },
    [seekTo],
  );

  // Active word polling (YouTube provider can signal current time)
  // Instead of polling, we let the YouTube API events drive this.
  // For now, activeTime is managed by a simple polling interval.

  // Polling effect for active word highlighting
  useEffect(() => {
    // We can't poll directly since we don't have getCurrentTime exposed
    // For now, skip active word tracking until we wire up a polling mechanism
    // The click-seek and search highlighting still work.
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Search highlighting
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    allWordsRef.current.forEach((w) => {
      if (!w.element) return;
      w.element.classList.remove("match");
      if (q && w.text.toLowerCase().includes(q)) {
        w.element.classList.add("match");
      }
    });
  }, [searchQuery]);

  return (
    <div>
      {/* Search within transcript */}
      <input
        type="text"
        placeholder="Search this transcript"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm bg-transparent mb-4"
      />

      {/* Transcript words */}
      <div
        ref={containerRef}
        onClick={handleClick}
        className="text-sm cursor-pointer select-none"
      />

      {allWordsRef.current.length === 0 && (
        <p className="text-gray-400 italic text-sm">No transcript available.</p>
      )}
    </div>
  );
}
