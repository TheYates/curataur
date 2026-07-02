"use client";

interface DatabaseStatsContentProps {
  dbStats: Record<string, unknown> | null;
  rowCounts: Record<string, number>;
  videoStats: {
    published: number;
    drafts: number;
    total: number;
    transcriptSegments: number;
  };
}

export default function DatabaseStatsContent({
  dbStats,
  rowCounts,
  videoStats,
}: DatabaseStatsContentProps) {
  const tables = (dbStats?.tables as Array<{ name: string; row_count: number; total_size: string }>) ?? [];
  const databaseSize = typeof dbStats?.database_size === "string" ? dbStats.database_size : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Database Stats</h1>
            <p className="text-muted-foreground mt-1">
              Storage usage and row counts for all tables
            </p>
          </div>
          <a
            href="/admin/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to Dashboard
          </a>
        </div>

        {/* Video stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Videos</p>
            <p className="text-2xl font-bold mt-1">{videoStats.total}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
              {videoStats.published}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Drafts</p>
            <p className="text-2xl font-bold mt-1 text-yellow-600 dark:text-yellow-400">
              {videoStats.drafts}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Transcript Segments</p>
            <p className="text-2xl font-bold mt-1">
              {videoStats.transcriptSegments.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Database size card (from RPC) */}
        {databaseSize && (
          <div className="rounded-lg border bg-card p-4 mb-8">
            <p className="text-sm text-muted-foreground">Total Database Size</p>
            <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
              {databaseSize}
            </p>
          </div>
        )}

        {/* Per-table sizes (from RPC) */}
        {tables.length > 0 && (
          <div className="rounded-lg border bg-card mb-8">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold">Table Sizes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Table</th>
                    <th className="text-right px-4 py-3 font-medium">Row Count</th>
                    <th className="text-right px-4 py-3 font-medium">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {tables.map((t) => {
                    const localCount = rowCounts[t.name] ?? t.row_count;
                    return (
                      <tr key={t.name} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 font-mono text-sm">{t.name}</td>
                        <td className="px-4 py-3 text-right">
                          {localCount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {t.total_size}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fallback: just row counts if RPC unavailable */}
        {tables.length === 0 && (
          <div className="rounded-lg border bg-card mb-8">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold">Row Counts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Table</th>
                    <th className="text-right px-4 py-3 font-medium">Row Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(rowCounts).map(([name, count]) => (
                    <tr key={name} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3 font-mono text-sm">{name}</td>
                      <td className="px-4 py-3 text-right">{count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-muted/30 text-xs text-muted-foreground border-t border-border">
              Tip: Run{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-[11px]">
                create function get_db_stats()
              </code>{" "}
              in the Supabase SQL editor to see disk usage per table.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
