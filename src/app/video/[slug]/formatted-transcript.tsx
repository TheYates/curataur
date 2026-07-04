"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { useYouTube } from "./youtube-context";

interface FormattedSection {
  heading: string;
  start_time: number;
  end_time: number;
  paragraphs: string[];
}

interface FormattedTranscriptProps {
  sections: FormattedSection[];
}

export default function FormattedTranscript({ sections }: FormattedTranscriptProps) {
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

  const handleClick = (startTime: number, e: React.MouseEvent) => {
    seekTo(startTime);
    const p = (e.currentTarget as HTMLElement).closest("[data-start]");
    if (p instanceof HTMLElement) showPlayerAbove(p, Math.floor(startTime));
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

      {sections.length > 0 ? (
        <div className="space-y-8">
          {sections.map((section, si) => (
            <section key={si}>
              <h3 className="transcript-block text-lg font-semibold mb-3 text-foreground">
                {searchQuery.trim() ? (
                  <HighlightedText text={section.heading} query={searchQuery.trim()} />
                ) : (
                  <WordHoverText text={section.heading} />
                )}
              </h3>
              {section.paragraphs.map((paragraph, pi) => (
                <p
                  key={pi}
                  data-start={section.start_time}
                  onClick={(e) => handleClick(section.start_time, e)}
                  className="transcript-block mb-4 text-[15px] leading-relaxed text-foreground cursor-pointer last:mb-0"
                >
                  {searchQuery.trim() ? (
                    <HighlightedText text={paragraph} query={searchQuery.trim()} />
                  ) : (
                    <WordHoverText text={paragraph} />
                  )}
                </p>
              ))}
            </section>
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
