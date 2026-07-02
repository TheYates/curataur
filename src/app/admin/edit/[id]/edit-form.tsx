"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  Save,
  X,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface ChapterData {
  title: string;
  start_time: number;
}

interface VideoData {
  id: string;
  title: string;
  slug: string;
  youtube_id: string;
  thumbnail_url: string | null;
  status: "draft" | "published";
  difficulty: string | null;
  category_id: string | null;
  ai_summary: string | null;
  key_takeaways: string[];
  chapters: ChapterData[];
  formatted_transcript: unknown;
  channels: { name: string } | null;
  categories: { name: string } | null;
}

interface EditFormProps {
  video: VideoData;
  categories: Category[];
}

export default function EditForm({ video, categories }: EditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form state
  const [title, setTitle] = useState(video.title);
  const [slug, setSlug] = useState(video.slug);
  const [difficulty, setDifficulty] = useState(video.difficulty ?? "none");
  const [status, setStatus] = useState(video.status);
  const [categoryId, setCategoryId] = useState(video.category_id ?? "");
  const [customCategory, setCustomCategory] = useState("");
  const [summary, setSummary] = useState(video.ai_summary ?? "");
  const [takeaways, setTakeaways] = useState<string[]>(
    Array.isArray(video.key_takeaways) ? video.key_takeaways : [],
  );
  const [chapters, setChapters] = useState<ChapterData[]>(
    Array.isArray(video.chapters) ? video.chapters : [],
  );

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const body: Record<string, unknown> = {
      title,
      slug,
      difficulty: difficulty === "none" ? null : difficulty,
      status,
      ai_summary: summary || null,
      key_takeaways: takeaways.filter((t) => t.trim()),
      chapters: chapters.filter((c) => c.title.trim()),
    };

    if (customCategory.trim()) {
      body.category_name = customCategory.trim();
    } else if (categoryId) {
      body.category_id = categoryId;
    } else {
      body.category_id = null;
    }

    try {
      const res = await fetch(`/api/admin/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Video saved successfully." });
        router.refresh();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error ?? "Failed to save." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateAI = async () => {
    setRegenerating(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/videos/${video.id}/regenerate`, {
        method: "POST",
      });

      if (res.ok) {
        setMessage({
          type: "success",
          text: "AI content regenerated successfully. Reloading...",
        });
        router.refresh();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error ?? "Regeneration failed." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error during regeneration." });
    } finally {
      setRegenerating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/videos/${video.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin/dashboard");
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete." });
      setDeleting(false);
    }
  };

  const addTakeaway = () => setTakeaways([...takeaways, ""]);
  const updateTakeaway = (i: number, val: string) => {
    const next = [...takeaways];
    next[i] = val;
    setTakeaways(next);
  };
  const removeTakeaway = (i: number) =>
    setTakeaways(takeaways.filter((_, idx) => idx !== i));

  const addChapter = () => setChapters([...chapters, { title: "", start_time: 0 }]);
  const updateChapter = (
    i: number,
    field: "title" | "start_time",
    val: string,
  ) => {
    const next = [...chapters];
    if (field === "title") {
      next[i] = { ...next[i], title: val };
    } else {
      next[i] = { ...next[i], start_time: parseInt(val) || 0 };
    }
    setChapters(next);
  };
  const removeChapter = (i: number) =>
    setChapters(chapters.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-8">
      {/* Message banner */}
      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm flex items-center justify-between ${
            message.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300"
              : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="shrink-0 ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Video info bar */}
      <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
        <div className="w-24 h-14 rounded overflow-hidden shrink-0 bg-muted">
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
          <p className="text-sm font-medium">
            {video.channels?.name ?? "Unknown channel"}
          </p>
          <a
            href={`/video/${video.slug}`}
            target="_blank"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            View on site <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={status === "published" ? "default" : "secondary"}>
            {status}
          </Badge>
        </div>
      </div>

      {/* Basic fields */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Slug</label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as "draft" | "published")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Difficulty</label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Category</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom category */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Or type a new category name
          </label>
          <Input
            placeholder="New category name..."
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">AI Summary</label>
          <Textarea
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="AI-generated summary of the video..."
          />
        </div>
      </div>

      {/* Key Takeaways */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Key Takeaways</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={addTakeaway}
            className="h-8"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {takeaways.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              No takeaways yet. Click &ldquo;Add&rdquo; to create one.
            </p>
          )}
          {takeaways.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-5 shrink-0">
                {i + 1}.
              </span>
              <Input
                value={t}
                onChange={(e) => updateTakeaway(i, e.target.value)}
                placeholder="Enter a key takeaway..."
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive"
                onClick={() => removeTakeaway(i)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Chapters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Chapters</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={addChapter}
            className="h-8"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {chapters.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              No chapters yet.
            </p>
          )}
          {chapters.map((ch, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                className="flex-1"
                value={ch.title}
                onChange={(e) => updateChapter(i, "title", e.target.value)}
                placeholder="Chapter title..."
              />
              <Input
                className="w-24 shrink-0 font-mono text-xs"
                type="number"
                min={0}
                value={ch.start_time}
                onChange={(e) => updateChapter(i, "start_time", e.target.value)}
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground shrink-0 w-10">
                seconds
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive"
                onClick={() => removeChapter(i)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateAI}
            disabled={regenerating}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1.5 ${regenerating ? "animate-spin" : ""}`}
            />
            {regenerating ? "Regenerating..." : "Regenerate AI"}
          </Button>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete video</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete &ldquo;{video.title}&rdquo;?
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
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

        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1.5" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
