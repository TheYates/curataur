"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { X, Loader2 } from "lucide-react";

interface AddVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: { id: string; name: string }[];
}

export default function AddVideoDialog({ open, onOpenChange, categories }: AddVideoDialogProps) {
  const router = useRouter();
  const [urls, setUrls] = useState("");
  const [categoryPick, setCategoryPick] = useState("none");
  const [customCategory, setCustomCategory] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const categoryName =
    customCategory.trim() ||
    (categoryPick !== "none" ? categories.find((c) => c.id === categoryPick)?.name : undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const lines = urls
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    setStatus("loading");
    setError("");
    setProgress({ done: 0, total: lines.length });

    let hasError = false;

    for (let i = 0; i < lines.length; i++) {
      try {
        const res = await fetch("/api/admin/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: lines[i],
            categoryName,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          toast.success(`(${i + 1}/${lines.length}) "${data.title}" ingested`);
        } else {
          toast.error(`(${i + 1}/${lines.length}) Failed: ${data.error ?? "Unknown error"}`);
          hasError = true;
        }
      } catch {
        toast.error(`(${i + 1}/${lines.length}) Network error for: ${lines[i].slice(0, 50)}…`);
        hasError = true;
      }

      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    if (hasError) {
      setError("Some videos failed. Check the toasts for details.");
      setStatus("error");
    } else {
      toast.success(`All ${lines.length} video${lines.length > 1 ? "s" : ""} ingested.`);
      setUrls("");
      setCategoryPick("none");
      setCustomCategory("");
      setStatus("idle");
    }

    router.refresh();
  };

  const handleClose = () => {
    if (status === "loading") return;
    onOpenChange(false);
  };

  const isLoading = status === "loading";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Video{isLoading ? ` (${progress.done}/${progress.total})` : ""}</DialogTitle>
          <DialogDescription>
            Paste one or more YouTube URLs — one per line. The pipeline will fetch
            metadata and transcripts for each.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              YouTube URLs <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder={`https://youtube.com/watch?v=...\nhttps://youtube.com/watch?v=...`}
              value={urls}
              onChange={(e) => {
                setUrls(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              disabled={isLoading}
              rows={5}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Category{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (optional — applied to all)
              </span>
            </label>
            <Select value={categoryPick} onValueChange={setCategoryPick} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
                <SelectItem value="new">+ New category...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {categoryPick === "new" && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                New category name
              </label>
              <Input
                placeholder="e.g. Finance, Technology"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                className="shrink-0 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <span className="text-xs text-muted-foreground">
              {isLoading ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Processing {progress.done + 1} / {progress.total}…
                </span>
              ) : urls.trim() ? (
                `${urls.trim().split("\n").filter((l) => l.trim()).length} URL${urls.trim().split("\n").filter((l) => l.trim()).length > 1 ? "s" : ""}`
              ) : (
                "Paste URLs above"
              )}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Done
              </Button>
              <Button type="submit" disabled={!urls.trim() || isLoading}>
                {isLoading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ingesting…
                  </span>
                ) : (
                  "Ingest"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
