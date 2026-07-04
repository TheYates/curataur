"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  channels: { name: string } | null;
  categories: { name: string } | null;
}

export default function SearchCommand() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleValueChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(value), 250);
  };

  const handleSelect = (slug: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/video/${slug}`);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setOpen(true)}
        title="Search transcripts"
      >
        <Search className="h-4 w-4" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search full transcripts..."
          value={query}
          onValueChange={handleValueChange}
        />
        <CommandList>
          {query.trim() === "" && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Type to search across every video&rsquo;s full transcript.
            </div>
          )}
          <CommandEmpty>
            {loading ? "Searching..." : "No results found."}
          </CommandEmpty>
          {results.length > 0 && (
            <CommandGroup heading="Videos">
              {results.map((video) => (
                <CommandItem
                  key={video.id}
                  value={video.slug}
                  onSelect={() => handleSelect(video.slug)}
                  className="flex items-center gap-3"
                >
                  {video.thumbnail_url && (
                    <img
                      src={video.thumbnail_url}
                      alt=""
                      className="w-12 h-7 rounded object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{video.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {video.channels?.name ?? "Unknown channel"}
                      {video.categories?.name && ` · ${video.categories.name}`}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
