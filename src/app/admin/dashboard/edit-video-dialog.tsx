"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  RefreshCw,
  Trash2,
  Plus,
  X,
  ExternalLink,
} from "lucide-react";
import type { VideoRow } from "./video-table";

interface Category {
  id: string;
  name: string;
}

interface EditVideoDialogProps {
  video: VideoRow | null;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditVideoDialog({
  video,
  categories,
  open,
  onOpenChange,
}: EditVideoDialogProps) {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [categoryId, setCategoryId] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [summary, setSummary] = useState("");
  const [takeaways, setTakeaways] = useState<string[]>([]);
  const [chapters, setChapters] = useState<{ title: string; start_time: number }[]>([]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Populate form when video changes
  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setSlug(video.slug);
      setStatus(video.status);
      setCategoryId(video.category_id ?? "");
      setCustomCategory("");
      setSummary(video.ai_summary ?? "");
      setTakeaways(Array.isArray(video.key_takeaways) ? video.key_takeaways : []);
      setChapters(Array.isArray(video.chapters) ? video.chapters : []);
      setMessage(null);
    }
  }, [video]);

  const handleSave = async () => {
    if (!video) return;
    setSaving(true);
    setMessage(null);

    const body: Record<string, unknown> = {
      title,
      slug,
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
        setMessage({ type: "success", text: "Saved successfully." });
        router.refresh();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error ?? "Failed to save." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateAI = async () => {
    if (!video) return;
    setRegenerating(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/videos/${video.id}/regenerate`, {
        method: "POST",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "AI regenerated. Reloading..." });
        router.refresh();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error ?? "Regeneration failed." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setRegenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!video) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/videos/${video.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onOpenChange(false);
        router.refresh();
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

  const addChapter = () =>
    setChapters([...chapters, { title: "", start_time: 0 }]);
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

  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Video
            <a
              href={`/video/${video.slug}`}
              target="_blank"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-normal"
            >
              <ExternalLink className="h-3 w-3" /> View
            </a>
          </DialogTitle>
          <DialogDescription>
            Edit metadata, AI content, and chapter markers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Message */}
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

          {/* basic fields */}
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
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as "draft" | "published")}
              >
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

          {/* Category */}
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Or type new category
              </label>
              <Input
                placeholder="New category name..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">AI Summary</label>
            <Textarea
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="AI-generated summary..."
            />
          </div>

          {/* Takeaways */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Key Takeaways</h3>
              <Button variant="outline" size="sm" onClick={addTakeaway} className="h-7">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
            {takeaways.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No takeaways yet.</p>
            ) : (
              <div className="space-y-2">
                {takeaways.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                    <Input
                      value={t}
                      onChange={(e) => updateTakeaway(i, e.target.value)}
                      placeholder="Enter a takeaway..."
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-destructive"
                      onClick={() => removeTakeaway(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chapters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Chapters</h3>
              <Button variant="outline" size="sm" onClick={addChapter} className="h-7">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
            {chapters.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No chapters.</p>
            ) : (
              <div className="space-y-2">
                {chapters.map((ch, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={ch.title}
                      onChange={(e) => updateChapter(i, "title", e.target.value)}
                      placeholder="Chapter title..."
                    />
                    <Input
                      className="w-20 shrink-0 font-mono text-xs"
                      type="number"
                      min={0}
                      value={ch.start_time}
                      onChange={(e) => updateChapter(i, "start_time", e.target.value)}
                      placeholder="0"
                    />
                    <span className="text-xs text-muted-foreground shrink-0 w-12">seconds</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-destructive"
                      onClick={() => removeChapter(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-4 flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateAI}
              disabled={regenerating}
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${regenerating ? "animate-spin" : ""}`} />
              {regenerating ? "Regenerating..." : "Regenerate AI"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
