import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Footer() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("categories")
    .select("name, slug, id")
    .order("name", { ascending: true });

  const categories = data ?? [];

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="font-bold text-xl tracking-tight">
              Curataur
            </Link>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              Curated YouTube videos with synced transcripts, AI summaries, and
              full-text search across every video.
            </p>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3">Categories</h4>
              <nav className="flex flex-col gap-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Links</h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/disclosure"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Disclosure
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Curataur. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
