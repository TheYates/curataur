"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Status {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
  step?: string;
}

export default function AddVideoForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    setStatus({ type: "loading", step: "Starting..." });

    try {
      const res = await fetch("/api/admin/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, categoryName: categoryName.trim() || undefined }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({
          type: "success",
          message: `"${data.title}" published successfully!`,
        });
        setUrl("");
        setCategoryName("");
      } else {
        setStatus({
          type: "error",
          message: data.error ?? "Failed to ingest video",
        });
      }
    } catch {
      setStatus({
        type: "error",
        message: "Something went wrong. Check your connection and try again.",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-500 mb-1">YouTube URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (status.type === "error") setStatus({ type: "idle" });
          }}
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={status.type === "loading"}
          autoFocus
          className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-4 text-sm bg-transparent disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-500 mb-1">
          Category <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          placeholder="e.g. Investing, Budgeting, Real Estate"
          disabled={status.type === "loading"}
          className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-4 text-sm bg-transparent disabled:opacity-50"
        />
        <p className="text-xs text-gray-400 mt-1">
          Type a new category or leave blank.
        </p>
      </div>

      {status.type === "error" && (
        <p className="text-sm text-red-500">{status.message}</p>
      )}

      {status.type === "success" && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300">
            {status.message}
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-2 text-xs text-green-600 dark:text-green-400 underline"
          >
            View on homepage
          </button>
        </div>
      )}

      {status.type === "loading" && (
        <div className="space-y-2">
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
            <div className="h-full w-1/3 bg-gray-900 dark:bg-gray-100 rounded animate-pulse" />
          </div>
          <p className="text-xs text-gray-400">{status.step ?? "Processing..."}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!url.trim() || status.type === "loading"}
        className="w-full h-10 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-black text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {status.type === "loading" ? "Ingesting..." : "Ingest Video"}
      </button>
    </form>
  );
}
