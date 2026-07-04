import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ModeToggle } from "@/components/mode-toggle";
import SearchCommand from "@/components/search-command";

export default async function Header() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("categories")
    .select("name, slug, id")
    .order("name", { ascending: true });

  const categories = data ?? [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-xl tracking-tight">
            Curataur
          </Link>
          {categories && categories.length > 0 && (
            <nav className="hidden sm:flex items-center gap-1">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <nav className="flex items-center gap-1">
          <SearchCommand />
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
