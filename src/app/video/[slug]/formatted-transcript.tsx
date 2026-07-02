"use client";

import { useState } from "react";
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

  const handleClick = (startTime: number) => {
    seekTo(startTime);
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

      {sections.length > 0 ? (
        <div className="space-y-8">
          {sections.map((section, si) => (
            <section key={si}>
              <h3 className="text-lg font-semibold mb-3 text-foreground">
                {searchQuery.trim() ? (
                  <HighlightedText text={section.heading} query={searchQuery.trim()} />
                ) : (
                  section.heading
                )}
              </h3>
              {section.paragraphs.map((paragraph, pi) => (
                <p
                  key={pi}
                  onClick={() => handleClick(section.start_time)}
                  className="mb-4 text-[15px] leading-relaxed text-foreground cursor-pointer hover:opacity-80 last:mb-0"
                >
                  {searchQuery.trim() ? (
                    <HighlightedText text={paragraph} query={searchQuery.trim()} />
                  ) : (
                    paragraph
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
