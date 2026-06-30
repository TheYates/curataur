"use client";

import { useYouTube } from "./youtube-context";
import type { Chapter } from "@/types/schema";

interface ChaptersListProps {
  chapters: Chapter[];
}

function formatChapterTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ChaptersList({ chapters }: ChaptersListProps) {
  const { seekTo } = useYouTube();

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {chapters.map((chapter, i) => (
        <button
          key={i}
          onClick={() => seekTo(chapter.start_time)}
          className="w-full flex items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <span>{chapter.title}</span>
          <span className="text-gray-400 text-xs font-mono">
            {formatChapterTime(chapter.start_time)}
          </span>
        </button>
      ))}
    </div>
  );
}
