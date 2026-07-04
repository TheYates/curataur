"use client";

import { useState } from "react";
import VideoTable, { type VideoRow } from "./video-table";
import AddVideoDialog from "./add-video-dialog";
import EditVideoDialog from "./edit-video-dialog";

interface DashboardContentProps {
  videos: VideoRow[];
  categories: { id: string; name: string }[];
  publishedCount: number;
  draftCount: number;
}

export default function DashboardContent({
  videos,
  categories,
  publishedCount,
  draftCount,
}: DashboardContentProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editVideo, setEditVideo] = useState<VideoRow | null>(null);

  return (
    <>
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Videos</p>
          <p className="text-2xl font-bold mt-1">{videos.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Published</p>
          <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
            {publishedCount}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Drafts</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600 dark:text-yellow-400">
            {draftCount}
          </p>
        </div>
      </div>

      {/* Categories bar */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8 text-sm">
          <span className="text-muted-foreground">Categories:</span>
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
            >
              {cat.name}
            </span>
          ))}
        </div>
      )}

      {/* Add button */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {videos.length} video{videos.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Add Video
        </button>
      </div>

      {/* Video table */}
      <VideoTable videos={videos} onEdit={(v) => setEditVideo(v)} allCategories={categories} />

      {/* Dialogs */}
      <AddVideoDialog open={addOpen} onOpenChange={setAddOpen} categories={categories} />
      <EditVideoDialog
        video={editVideo}
        categories={categories}
        open={editVideo !== null}
        onOpenChange={(open) => {
          if (!open) setEditVideo(null);
        }}
      />
    </>
  );
}
