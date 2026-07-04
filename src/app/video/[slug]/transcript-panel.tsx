"use client";

import { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useYouTube } from "./youtube-context";
import type { TranscriptSegment } from "@/types/schema";

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
}

export default function TranscriptPanel({ segments }: TranscriptPanelProps) {
  const { seekTo } = useYouTube();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleSearch = () => {
    setShowSearch((v) => {
      if (!v) setTimeout(() => searchInputRef.current?.focus(), 100);
      return !v;
    });
  };

  // Check if segments have AI-driven structural data
  const hasStructure = useMemo(
    () => segments.some((s) => s.section_header || s.starts_new_paragraph),
    [segments],
  );

  // Group segments into paragraph groups with optional section headers
  const paragraphGroups = useMemo(() => {
    if (segments.length === 0) return [];

    if (hasStructure) {
      // AI-driven grouping: respect starts_new_paragraph and section_header
      const groups: {
        segments: TranscriptSegment[];
        section_header: string | null;
      }[] = [];
      let currentGroup: TranscriptSegment[] = [];
      let currentSection: string | null = null;

      for (const seg of segments) {
        if (seg.starts_new_paragraph && currentGroup.length > 0) {
          groups.push({
            segments: currentGroup,
            section_header: currentSection,
          });
          currentGroup = [];
          currentSection = null;
        }
        if (seg.section_header) {
          currentSection = seg.section_header;
        }
        currentGroup.push(seg);
      }
      if (currentGroup.length > 0) {
        groups.push({
          segments: currentGroup,
          section_header: currentSection,
        });
      }
      return groups;
    }

    // Fallback heuristic grouping (same as before)
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
  }, [segments, hasStructure]);

  const handleClick = (e: React.MouseEvent) => {
    const p = (e.target as HTMLElement).closest("[data-start]");
    if (!(p instanceof HTMLElement)) return;

    const start = parseFloat(p.dataset.start || "0");
    const end = parseFloat(p.dataset.end || "0");
    const words = (p.textContent || "").split(/\s+/).filter(Boolean).length;
    if (words === 0) return;

    const rect = p.getBoundingClientRect();
    const clickY = (e.clientY - rect.top) / rect.height;
    const clickRatio = Math.max(0, Math.min(1, clickY));
    const time = (start + (end - start) * clickRatio) / 1000;

    // Seek the hidden API player (audio muted)
    seekTo(time);

    // Create a visual iframe above the paragraph in the document flow
    showPlayerAbove(p, Math.floor(time));
  };

  return (
    <div>
      <style>{`
        .transcript-block:hover > .word-span {
          color: hsl(var(--muted-foreground));
        }
        .transcript-block > .word-span:hover {
          color: hsl(var(--foreground)) !important;
        }
      `}</style>
      {/* Search toggle — icon only */}
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={toggleSearch}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={showSearch ? "Close search" : "Search transcript"}
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Expandable search input */}
      {showSearch && (
        <div className="relative mb-4">
          <input
            ref={searchInputRef}
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
      )}

      {paragraphGroups.length > 0 ? (
        <div>
          {paragraphGroups.map((group, gi) => {
            if (hasStructure) {
              const g = group as {
                segments: TranscriptSegment[];
                section_header: string | null;
              };
              const first = g.segments[0];
              const last = g.segments[g.segments.length - 1];
              const fullText = g.segments.map((s) => s.text).join(" ");
              return (
                <div key={gi} className="mb-5">
                  {g.section_header && (
                    <h3 className="transcript-block text-lg font-semibold mb-3 mt-6 text-foreground">
                      {searchQuery.trim() ? (
                        <HighlightedText
                          text={g.section_header}
                          query={searchQuery.trim()}
                        />
                      ) : (
                        <WordHoverText text={g.section_header} />
                      )}
                    </h3>
                  )}
                  <p
                    data-start={first.start_time}
                    data-end={last.end_time}
                    onClick={handleClick}
                    className="transcript-block text-[15px] leading-relaxed text-foreground cursor-pointer"
                  >
                    {searchQuery.trim() ? (
                      <HighlightedText text={fullText} query={searchQuery.trim()} />
                    ) : (
                      g.segments.map((seg, si) => (
                        <span key={seg.id}>
                          {si > 0 && " "}
                          <WordHoverText text={seg.text} />
                        </span>
                      ))
                    )}
                  </p>
                </div>
              );
            }
            // Fallback rendering for heuristic chunks
            const chunk = group as { text: string; startTime: number; endTime: number };
            return (
              <p
                key={gi}
                data-start={chunk.startTime}
                data-end={chunk.endTime}
                onClick={handleClick}
                className="transcript-block mb-5 text-[15px] leading-relaxed text-foreground cursor-pointer"
              >
                {searchQuery.trim() ? (
                  <HighlightedText text={chunk.text} query={searchQuery.trim()} />
                ) : (
                  <WordHoverText text={chunk.text} />
                )}
              </p>
            );
          })}
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

/** Create a visual YouTube iframe above the clicked paragraph in the document flow.
 *  This avoids the iframe-reload issue from DOM moves and the overlap issue
 *  from fixed positioning — the iframe is created fresh in the right position. */
function showPlayerAbove(paragraph: HTMLElement, seconds: number) {
  const youtubeId = document.documentElement.dataset.youtubeId;
  if (!youtubeId) return;

  // Remove any existing visual player
  const existing = document.querySelector("[data-player-visual]");
  if (existing) existing.remove();

  // Create player container with iframe
  const container = document.createElement("div");
  container.setAttribute("data-player-visual", "");
  container.className =
    "w-full max-w-2xl mx-auto mb-6 rounded-lg overflow-hidden shadow-lg";
  container.style.cssText = "aspect-ratio: 16 / 9;";

  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=${seconds}&rel=0&modestbranding=1`;
  iframe.className = "w-full h-full";
  iframe.allow = "autoplay; encrypted-media";
  iframe.allowFullscreen = true;
  container.appendChild(iframe);

  // Insert above the paragraph in the DOM
  paragraph.parentNode?.insertBefore(container, paragraph);

  // Scroll so the player is visible just above the paragraph
  const gap = 16;
  const paragraphTop = paragraph.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({
    top: paragraphTop - container.offsetHeight - gap,
    behavior: "smooth",
  });
}

/** Renders text word-by-word so each word has a hover highlight effect. */
function WordHoverText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((segment, i) => {
        if (segment.trim().length === 0) return <span key={i}>{segment}</span>;
        return (
          <span
            key={i}
            className="word-span px-0.5 -mx-0.5 rounded-sm transition-colors duration-150"
          >
            {segment}
          </span>
        );
      })}
    </>
  );
}
