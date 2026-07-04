-- ============================================================
-- Schema for a transcript-synced video curation site
-- Target: Supabase (Postgres)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- channels: dedupe creator info across videos
-- ------------------------------------------------------------
create table channels (
  id uuid primary key default uuid_generate_v4(),
  youtube_channel_id text unique not null,
  name text not null,
  url text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- categories: top-level site sections (e.g. "Budgeting", "Investing")
-- ------------------------------------------------------------
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  slug text unique not null
);

-- ------------------------------------------------------------
-- tags: loose many-to-many topical labels, used for "related videos"
-- ------------------------------------------------------------
create table tags (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null
);

-- ------------------------------------------------------------
-- videos: the core table
-- ------------------------------------------------------------
create table videos (
  id uuid primary key default uuid_generate_v4(),
  youtube_id text unique not null,          -- the 11-char YouTube video ID
  channel_id uuid references channels(id),
  category_id uuid references categories(id),
  slug text unique not null,                -- url-friendly, e.g. "beginners-guide-to-budgeting"

  title text not null,
  thumbnail_url text,
  duration_seconds integer,

  published_at timestamptz,                 -- original upload date on YouTube
  added_at timestamptz default now(),       -- when you curated it onto the site
  status text not null default 'draft'
    check (status in ('draft','published')),
  difficulty text
    check (difficulty in ('beginner','intermediate','advanced')),

  curator_note text,                       -- short human-written EEAT note: why this video was curated
  ai_summary text,
  key_takeaways jsonb default '[]'::jsonb,  -- e.g. ["Track spending for 30 days", ...]
  chapters jsonb default '[]'::jsonb,       -- e.g. [{"title": "Intro", "start_time": 0}, ...]
  formatted_transcript jsonb default null,  -- AI-structured sections for blog-like reading: [{heading, start_time, end_time, paragraphs[]}]

  view_count integer default 0,
  search_vector tsvector,                   -- populated by refresh_video_search(), see below

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_videos_status on videos(status);
create index idx_videos_category on videos(category_id);
create index idx_videos_channel on videos(channel_id);
create index idx_videos_search on videos using gin(search_vector);

-- ------------------------------------------------------------
-- video_tags: many-to-many join table
-- ------------------------------------------------------------
create table video_tags (
  video_id uuid references videos(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (video_id, tag_id)
);

-- ------------------------------------------------------------
-- transcript_segments: one row per caption line (not per word)
-- word-level timestamps are interpolated at render time
-- ------------------------------------------------------------
create table transcript_segments (
  id uuid primary key default uuid_generate_v4(),
  video_id uuid not null references videos(id) on delete cascade,
  start_time numeric(8,2) not null,
  end_time numeric(8,2) not null,
  text text not null,
  order_index integer not null,
  section_header text,
  starts_new_paragraph boolean not null default false
);

create index idx_segments_video on transcript_segments(video_id, order_index);

-- ------------------------------------------------------------
-- subscribers: for the auto-generated weekly digest
-- ------------------------------------------------------------
create table subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  subscribed_at timestamptz default now(),
  confirmed boolean default false
);

-- ============================================================
-- Full-text search
-- ============================================================
-- Run this after a video's metadata, summary, AND transcript
-- segments have all been inserted in your ingestion pipeline.
-- Title is weighted highest, summary next, full transcript last,
-- so a match in the title ranks above a match buried in the transcript.

create or replace function refresh_video_search(p_video_id uuid)
returns void as $$
begin
  update videos
  set search_vector =
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(ai_summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(
      (select string_agg(text, ' ' order by order_index)
       from transcript_segments where video_id = p_video_id), '')
    ), 'C')
  where id = p_video_id;
end;
$$ language plpgsql;

-- Example search query (site-wide, across every video's full transcript):
-- select id, title, slug, ts_rank(search_vector, query) as rank
-- from videos, websearch_to_tsquery('english', 'emergency fund') query
-- where search_vector @@ query and status = 'published'
-- order by rank desc;

-- ============================================================
-- Database stats: used by the /admin/database page
-- Run this in Supabase SQL editor after deploying.
-- ============================================================
create or replace function get_db_stats()
returns json
language sql
security definer
as $$
  select json_build_object(
    'database_size', pg_size_pretty(pg_database_size(current_database())),
    'tables', coalesce((
      select json_agg(json_build_object(
        'name', t.tablename,
        'row_count', (select reltuples::bigint from pg_class where relname = t.tablename),
        'total_size', pg_size_pretty(pg_total_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename)))
      ) order by (select reltuples::bigint from pg_class where relname = t.tablename) desc)
      from pg_tables t
      where t.schemaname = 'public'
    ), '[]'::json)
  );
$$;

-- ============================================================
-- Common query patterns for reference
-- ============================================================
-- Homepage feed:
--   select * from videos where status = 'published' order by added_at desc;
--
-- Single video page (with ordered transcript):
--   select * from videos where slug = $1;
--   select * from transcript_segments where video_id = $1 order by order_index;
--
-- Related videos (shared tags):
--   select v.* from videos v
--   join video_tags vt on vt.video_id = v.id
--   where vt.tag_id in (select tag_id from video_tags where video_id = $1)
--     and v.id != $1 and v.status = 'published'
--   limit 4;
