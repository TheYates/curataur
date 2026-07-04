"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, ExternalLink, Eye, EyeOff } from "lucide-react";

export interface VideoRow {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  status: "draft" | "published";
  added_at: string;
  youtube_id: string;
  channels: { name: string } | null;
  categories: { name: string } | null;
  category_id: string | null;
  curator_note: string | null;
  ai_summary: string | null;
  key_takeaways: string[];
  chapters: { title: string; start_time: number }[];
}

interface VideoTableProps {
  videos: VideoRow[];
  onEdit: (video: VideoRow) => void;
  allCategories: { id: string; name: string }[];
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const PAGE_SIZE = 20;

export default function VideoTable({ videos, onEdit, allCategories }: VideoTableProps) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(videos.length / PAGE_SIZE));

  // Reset to first page when videos list changes (add/delete)
  useEffect(() => {
    setPage(0);
  }, [videos.length]);

  const pagedVideos = videos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleCategoryChange = async (video: VideoRow, categoryId: string) => {
    try {
      const res = await fetch(`/api/admin/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId === "none" ? null : categoryId }),
      });
      if (res.ok) {
        toast.success("Category updated.");
        router.refresh();
      }
    } catch {
      toast.error("Failed to update category.");
    }
  };

  const handleToggleStatus = async (video: VideoRow) => {
    const newStatus = video.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/admin/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(newStatus === "published" ? "Video published." : "Video unpublished.");
        router.refresh();
      }
    } catch (err) {
      toast.error("Failed to toggle status.");
      console.error("Failed to toggle status:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/videos/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Video deleted.");
        setDeleteId(null);
        router.refresh();
      }
    } catch (err) {
      toast.error("Failed to delete video.");
      console.error("Failed to delete:", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[320px]">Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                No videos yet.
              </TableCell>
            </TableRow>
          ) : (
            pagedVideos.map((video) => (
              <TableRow key={video.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-9 rounded overflow-hidden shrink-0 bg-muted">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          N/A
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug truncate max-w-[220px]">
                        {video.title}
                      </p>
                      {video.status === "published" && (
                        <a
                          href={`/video/${video.slug}`}
                          target="_blank"
                          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={video.status === "published" ? "default" : "secondary"}
                    className="text-[11px]"
                  >
                    {video.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={video.category_id ?? "none"}
                    onValueChange={(val) => handleCategoryChange(video, val)}
                  >
                    <SelectTrigger className="h-7 text-xs w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">None</SelectItem>
                      {allCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-xs">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {video.channels?.name ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(video.added_at)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={video.status === "published" ? "Unpublish" : "Publish"}
                      onClick={() => handleToggleStatus(video)}
                    >
                      {video.status === "published" ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Edit"
                      onClick={() => onEdit(video)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Dialog
                      open={deleteId === video.id}
                      onOpenChange={(open) => {
                        if (!open) setDeleteId(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete"
                          onClick={() => setDeleteId(video.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete video</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete &ldquo;{video.title}&rdquo;?
                            This action cannot be undone. The transcript segments will
                            also be removed.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setDeleteId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                          >
                            {deleting ? "Deleting..." : "Delete"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {/* Pagination */}
      {videos.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {videos.length} total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
