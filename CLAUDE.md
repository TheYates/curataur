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
- **UI components:** [HeroUI](https://heroui.com) (`@heroui/react`) — use its components
  for all UI primitives (buttons, inputs, cards, badges, modals, etc.) rather than
  building bespoke ones. HeroUI v3 is built on Tailwind CSS v4 and React Aria, uses a
  compound component API (e.g. `Card.Header`, `Card.Content`), and needs no `<Provider>`
  wrapper. Install with `npm install @heroui/react` (or scaffold via `npx heroui-cli@latest
  init` for a pre-configured Next.js + Tailwind v4 starter). The transcript word-click
  targets and the YouTube player wrapper are custom and won't come from HeroUI — use
  HeroUI for everything around them (layout, nav, search input, badges, buttons, cards).
- **Hosting:** Vercel
- **Database:** Supabase (Postgres) — schema is in `schema.sql` in this repo, already
  finalized. Use it as-is; do not redesign the tables without flagging why first.
- **Video:** YouTube IFrame Player API (client-side), YouTube Data API v3 (server-side,
  for title/thumbnail/duration metadata)
- **Captions/transcripts:** Pull YouTube's own auto-generated caption track (via the
  `youtube-transcript-api` approach / the public `timedtext` endpoint). This returns
  timestamped caption *lines*, not individual words. Word-level click targets are
  produced by interpolating evenly across each line's start/end time at render time —
  do not store per-word rows in the database, store per-line segments only
  (see `transcript_segments` table in schema.sql).
- **AI generation:** Two separate AI API calls per video during ingestion, with a
  primary provider and a fallback provider (each has its own independent free-tier
  quota, so stacking them gives real resilience instead of hoping one tiny quota
  holds up):
  - **Primary: Google Gemini** via Google AI Studio, model `gemini-flash-lite` (or
    current equivalent — check Google's live pricing/model page, names change
    frequently). Use Flash-Lite specifically, not Flash or Pro — Pro was removed
    from the free tier entirely in April 2026, and Flash-Lite currently has the most
    generous free quota of the remaining free models. Free-tier limits are enforced
    per Google Cloud *project*, not per API key, and are low enough (roughly 15
    requests/minute, ~1,000/day as of mid-2026, but check Google AI Studio's live
    quota panel for the actual current numbers rather than trusting a hardcoded
    value) that rapid dev-loop testing can trip a 429 almost immediately — this is
    expected, not a bug.
  - **Fallback: Groq**, model `llama-3.3-70b-versatile` (or current equivalent).
    Groq is a separate provider with its own independent free quota (no shared
    project/billing history with Google), so it acts as real backup capacity, not
    just a second key on the same limit. On a 429 or other failure from Gemini,
    retry the same request against Groq before failing the ingestion step.
  - Both calls are given the full transcript text, and free-tier structured JSON
    output is not as strictly guaranteed as some paid APIs — always validate/parse
    the response and retry once (on the same provider, then the fallback provider)
    on malformed JSON before failing the ingestion step. Implement retries with
    exponential backoff, not immediate re-requests, since immediate retries on a
    rate limit make it worse.
  1. **Summary/takeaways/chapters** — returns structured JSON:
     `{ summary, key_takeaways[], chapters[] }`. Store on the `videos` row (`ai_summary`,
     `key_takeaways` jsonb, `chapters` jsonb columns already exist in schema.sql).
  2. **Blog-style formatting** — turns the flat transcript into a readable, blog-like
     layout (paragraph breaks and section headers) WITHOUT altering a single word of
     what was actually said. Feed the model the ordered transcript segments (each
     tagged with its `order_index`), and have it return only structural decisions
     referencing those indexes: which segments start a new paragraph
     (`starts_new_paragraph`), and which segments should have a `section_header`
     inserted before them (plus the header text itself, which is new label content,
     not a restatement of the transcript). Write these two fields back onto the
     matching `transcript_segments` rows — never touch the `text` column. This keeps
     every word individually clickable/seekable while making the page scannable like
     a real blog post instead of a wall of text.
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

## SEO (build this in from the start, not as a retrofit)

This site's core SEO advantage is that a full-text, timestamped transcript is
searchable content YouTube itself does not expose well to Google. Protect and
maximize that advantage:

- **Structured data:** every video page must include `VideoObject` schema (JSON-LD) —
  name, description, thumbnailUrl, uploadDate, duration, and embedUrl at minimum. This
  is what unlocks rich snippets and knowledge-panel eligibility and is the single
  highest-leverage technical SEO task, do this before anything else on this list.
- **Answer-first page structure:** the AI summary and key takeaways sections (already
  in scope) should render near the top of the page, above the fold if possible — this
  is the exact format both Google's AI Overviews and AI answer engines (ChatGPT,
  Perplexity, Claude) prefer to lift and cite. Keep the summary itself concise
  (roughly 50-100 words) before the more detailed transcript below it.
- **Curator's note:** each video gets a short human-written note (new `curator_note`
  column on `videos` in schema.sql) explaining why it was picked. Render this near the
  top of the page. This is a genuine trust/EEAT signal — Google's spam policies
  specifically penalize mass-produced, unedited content at scale, and a visible human
  editorial voice is a direct defense against that, not just a nice-to-have.
- **Category/pillar pages:** `/category/[slug]` pages (already in scope) should act as
  topic hubs — a short intro paragraph plus links to every video in that category, so
  each category builds topical authority as a cluster rather than existing as
  disconnected individual pages.
- **Technical hygiene:** auto-generate an XML sitemap (Next.js supports this natively
  via `app/sitemap.ts`), unique and descriptive `<title>`/meta description per page
  (include the video's main topic near the start of the title), and keep pages fast —
  favor static generation or ISR for video pages over client-side fetching, since page
  speed and Core Web Vitals are direct ranking factors.
- **Internal linking:** every video page should link to 2-4 related videos (via shared
  tags — the `video_tags` table already supports this) using descriptive anchor text,
  not "click here" — this is both a ranking signal and a real engagement/retention tool.

## Core user flows

**Curator flow (the only "content creation" step):**
1. Curator pastes a YouTube URL into an internal/admin route.
2. Backend fetches video metadata (YouTube Data API) and the caption track.
3. Backend calls the Gemini API (free tier) with the transcript to generate summary,
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
4. Can also use the site-wide search bar to find a moment across *all* videos, not just
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
  login, just middleware that blocks the route until the correct password is entered).
  Include a required short text field for the curator's note (see SEO section above)
  — do not let a video be published without one.
- `/about` — who's behind the site and why it exists. Real, human-written copy (not
  boilerplate) — this is also an E-E-A-T/trust signal for both AdSense review and SEO.
- `/contact` — a simple contact form or email address is sufficient for V1.
- `/privacy` — required since the site collects data (newsletter subscriber emails via
  the `subscribers` table) and is a prerequisite for AdSense approval. Must disclose:
  what data is collected (subscriber emails), that Google AdSense/ads may use cookies
  once ads are added, and that YouTube embeds may set their own cookies per Google's
  policies.
- `/disclosure` — plain-language affiliate/advertising disclosure page (required once
  affiliate links or ads go live, but build the page now so it exists before either is
  added — see "Explicitly out of scope" below, ads/affiliate links themselves are still
  not being built yet).

These four pages should be linked from the site footer on every page.

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
- The `/about`, `/contact`, `/privacy`, and `/disclosure` pages (see "Pages to
  scaffold" above) exist specifically to make the site ready for a future Google
  AdSense application and affiliate program applications. Their content should be real
  and specific to this site, not generic template text — reviewers (and readers) can
  tell the difference.
- The blog-formatting AI pass (paragraph breaks + section headers) must never alter,
  reorder, add, or remove a single word of the actual transcript text. It only decides
  layout (where paragraphs/headers go) and writes new header labels — it does not touch
  the `text` column on `transcript_segments` under any circumstance. Validate this in
  code after the API call (e.g. reconstruct the full transcript from segments and diff
  it against the original) rather than trusting the prompt alone.

## Environment variables needed

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
YOUTUBE_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
ADMIN_PASSWORD=
```

## Decisions already made (do not re-ask these)

- **Niche scope:** multi-category from day one. Finance is the first category but the
  schema, ingestion form, and homepage must treat categories as open-ended from the start.
- **Admin auth:** `/admin/add-video` is protected by a simple shared-password gate (see
  "Pages to scaffold" above). No accounts, no per-user login — just one password.
- **Category taxonomy:** created ad hoc as the curator adds videos, not pre-seeded.