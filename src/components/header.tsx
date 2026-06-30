import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Header() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("categories")
    .select("name, slug, id")
    .order("name", { ascending: true });

  const categories = data ?? [];

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-xl">
            Curataur
          </Link>
          {categories && categories.length > 0 && (
            <nav className="hidden sm:flex items-center gap-1">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="/search"
            className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          >
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}
