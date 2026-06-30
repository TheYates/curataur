"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

interface SearchInputProps {
  initialQuery: string;
}

export default function SearchInput({ initialQuery }: SearchInputProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/search");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search full transcripts..."
        className="flex-1 h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-4 text-sm bg-transparent"
        autoFocus
      />
      <button
        type="submit"
        className="h-10 px-5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-black text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Search
      </button>
    </form>
  );
}
