-- Add per-segment structural fields for blog-style transcript formatting
-- These allow the AI to define section headers and paragraph breaks
-- without ever modifying the actual transcript text.

ALTER TABLE transcript_segments
  ADD COLUMN section_header TEXT,
  ADD COLUMN starts_new_paragraph BOOLEAN NOT NULL DEFAULT false;

-- Create an index on video_id + order_index for efficient batch updates
CREATE INDEX IF NOT EXISTS idx_transcript_segments_video_order
  ON transcript_segments (video_id, order_index);
