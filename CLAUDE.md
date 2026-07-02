# Curataur — Project Brief

## What this is

A content site that curates YouTube videos across multiple categories from launch (not
finance-only — finance is just the first category) and gives each one a synced,
clickable transcript: click any word or phrase and the embedded YouTube player jumps to
that exact second. Each video page also gets an AI-generated summary, key takeaways, and
chapter markers, all derived from the transcript. There is also one search bar that
searches across every video's full transcript site-wide, not just titles.

The business model is a solo curator pasting in YouTube URLs they've found and letting
the pipeline do the rest — so the ingestion step (URL in → fully published page out)
should require as close to zero manual work as possible.

## Reference prototype

`reference-demo.html` in this repo is a working, standalone HTML/JS prototype of the
target UX: a real embedded YouTube video via the IFrame Player API, a transcript panel
where clicking a word calls `player.seekTo()`, a chapters list that does the same, and a
search box that highlights matches across the transcript. Use it as the source of truth
for how the synced-transcript interaction should behave and feel. Note: the transcript
text in that prototype is placeholder/illustrative copy, not real captions — real
ingestion logic is described below.

## Tech stack

- **Framework:** Next.js (App Router), TypeScript
- **UI components:** [shadcn/ui](https://ui.shadcn.com) (New York style, slate base). Install
  via `pnpm dlx shadcn@2.3.0 add <component>`. All components live under
  `src/components/ui/`. The `cn()` utility is at `src/lib/utils.ts`.
- **Styling:** Tailwind CSS v3.4 with `tailwindcss-animate` plugin. Config in
  `tailwind.config.ts`. Dark mode via `class` strategy (toggled by `next-themes`).
- **Package manager:** pnpm (preferred) or bun.
- **Hosting:** Vercel
- **Database:** Supabase (Postgres) — schema is in `schema.sql` in this repo, already
  finalized. Use it as-is; do not redesign the tables without flagging why first.
- **Video:** YouTube IFrame Player API (client-side), YouTube Data API v3 (server-side,
  for title/thumbnail/duration metadata)
- **Captions/transcripts:** Pull YouTube's own auto-generated caption track (via the
  `youtube-transcript-api` approach / the public `timedtext` endpoint). This returns
  timestamped caption _lines_, not individual words. Word-level click targets are
  produced by interpolating evenly across each line's start/end time at render time —
  do not store per-word rows in the database, store per-line segments only
  (see `transcript_segments` table in schema.sql).
- **AI generation:** One Gemini API call per video during ingestion (via `gemini-2.0-flash`), given the full
  transcript text, returning structured JSON: `{ summary, key_takeaways[], chapters[] }`.
  Store the result directly on the `videos` row (`ai_summary`, `key_takeaways` jsonb,
  `chapters` jsonb columns already exist in schema.sql).
- **Search:** Postgres full-text search (`tsvector`/`tsquery`) via the
  `refresh_video_search()` function already defined in schema.sql. No external search
  service needed.

## Visual style

Current implementation is functionally correct but visually flat — plain text on a plain
dark background with no hierarchy. Target look: the Supabase blog
(https://supabase.com/blog), adapted with HeroUI components. Specifically:

- **Layout:** center the article content in a comfortable reading column, roughly
  680–720px max-width — do not let body text/transcript stretch full-width even on large
  screens. The video player itself can be wider than the text column.
- **Typography:** strong size contrast between elements — large bold headline (~2–2.5rem),
  a clearly smaller and more muted byline/meta row, and body copy with generous line-height
  (1.6–1.8). Use a refined sans-serif (Inter or similar via HeroUI's default font stack),
  not the browser default.
- **Metadata row:** directly under the title, one horizontal row containing: channel/author
  name, publish or added date, watch time, and a category pill — use a HeroUI `Chip`/badge
  component for the category and difficulty tags, not plain text. This row is the single
  biggest gap versus the reference site right now.
- **Color:** dark background, but not pure black — use a dark warm or cool gray. Pick one
  accent color and use it sparingly and consistently: links, the active transcript word
  highlight, and primary buttons. Do not scatter multiple accent colors around the page.
- **Cards:** on the homepage and category pages, each video listing should be a HeroUI
  `Card` — rounded corners, a subtle 1px border, thumbnail image, and a soft hover state
  (border brightens slightly or a faint elevation change) — not a plain stacked list.
- **Spacing:** more vertical breathing room between page sections than feels natural at
  first pass — err toward generous.

## Core user flows

**Curator flow (the only "content creation" step):**

1. Curator pastes a YouTube URL into an internal/admin route.
2. Backend fetches video metadata (YouTube Data API) and the caption track.
3. Backend calls the Anthropic API once with the transcript to generate summary,
   takeaways, and chapters.
4. Everything is written to Supabase (`videos` + `transcript_segments` rows), then
   `refresh_video_search()` is called.
5. Video is marked `status = 'published'` and is now live.

**Visitor flow:**

1. Lands on homepage feed of published videos, or a category page, or a search result.
2. Opens a video page: sees the real embedded player, badges (difficulty/watch time),
   AI summary + key takeaways, a chapters list, a search box scoped to that transcript
   (nice-to-have), and the full clickable transcript below the player.
3. Clicking any transcript word or any chapter seeks the live video to that timestamp.
4. Can also use the site-wide search bar to find a moment across _all_ videos, not just
   the one they're on.

## Pages to scaffold (V1)

- `/` — homepage, published videos ordered by `added_at desc`
- `/video/[slug]` — single video page (the core experience described above)
- `/search` — site-wide transcript search, results link straight to the matching
  timestamp on the relevant video page (e.g. `/video/[slug]?t=92`)
- `/category/[slug]` — videos filtered by category. Categories are created ad hoc by
  the curator during ingestion (no fixed pre-seeded list) — the add-video form should
  let the curator type a new category name or pick an existing one
- `/admin/add-video` — the curator's ingestion form, protected by a simple password
  gate (a single shared password is enough for V1 — no user accounts, no per-user
  login, just middleware that blocks the route until the correct password is entered)

## Explicitly out of scope for V1 (do not build yet)

- User accounts / visitor-facing auth of any kind (the `/admin/add-video` password
  gate described above is the one exception — that's in scope, full user login isn't)
- The "ask the video a question" AI chat feature
- Automated newsletter sending (the `subscribers` table exists for capturing emails,
  but do not build the sending pipeline yet)
- Multi-language transcript translation
- Ads or affiliate link insertion
- Mobile app / anything beyond a responsive web page

Keep V1 scoped to: ingest a video → render it with a working synced transcript →
make it findable via search and category browsing. Everything else is a later phase.

## Legal / content constraints (do not deviate from these)

- Only use YouTube's own official caption data, fetched programmatically. Never scrape
  third-party caption/subtitle sites.
- Never download or rehost the actual video file — embed via the official player only.
- Every video page must visibly credit and link to the original channel/creator.
- AI-generated summaries and takeaways should be original synthesis, not a near-verbatim
  restatement of the transcript — keep prompts instructing the model to summarize and
  restructure, not paraphrase closely.

## Environment variables needed

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
YOUTUBE_API_KEY=
GEMINI_API_KEY=
ADMIN_PASSWORD=
```

## Decisions already made (do not re-ask these)

- **Niche scope:** multi-category from day one. Finance is the first category but the
  schema, ingestion form, and homepage must treat categories as open-ended from the start.
- **Admin auth:** `/admin/add-video` is protected by a simple shared-password gate (see
  "Pages to scaffold" above). No accounts, no per-user login — just one password.
- **Category taxonomy:** created ad hoc as the curator adds videos, not pre-seeded.
