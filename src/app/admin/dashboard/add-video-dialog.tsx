"use client";

import { useState } from "react";
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
import { X } from "lucide-react";

interface AddVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddVideoDialog({ open, onOpenChange }: AddVideoDialogProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/admin/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          categoryName: categoryName.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setUrl("");
        setCategoryName("");
        setStatus("idle");
        onOpenChange(false);
        router.refresh();
      } else {
        setError(data.error ?? "Ingestion failed.");
        setStatus("error");
      }
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Video</DialogTitle>
          <DialogDescription>
            Paste a YouTube URL to ingest a new video. The pipeline will fetch
            metadata, transcript, and AI content automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              YouTube URL <span className="text-destructive">*</span>
            </label>
            <Input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              disabled={status === "loading"}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Category{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <Input
              placeholder="e.g. Finance, Technology"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              disabled={status === "loading"}
            />
          </div>

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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={status === "loading"}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!url.trim() || status === "loading"}>
              {status === "loading" ? "Ingesting..." : "Ingest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
