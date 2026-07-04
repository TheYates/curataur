export interface Database {
  public: {
    Tables: {
      channels: {
        Row: Channel;
        Insert: Omit<Channel, "id" | "created_at">;
        Update: Partial<Omit<Channel, "id">>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id">;
        Update: Partial<Omit<Category, "id">>;
        Relationships: [];
      };
      tags: {
        Row: Tag;
        Insert: Omit<Tag, "id">;
        Update: Partial<Omit<Tag, "id">>;
        Relationships: [];
      };
      videos: {
        Row: Video;
        Insert: Omit<
          Video,
          "id" | "added_at" | "created_at" | "updated_at" | "view_count" | "search_vector"
        >;
        Update: Partial<Omit<Video, "id">>;
        Relationships: [
          {
            foreignKeyName: string;
            columns: string[];
            referencedRelation: "channels" | "categories";
            referencedColumns: string[];
          },
        ];
      };
      video_tags: {
        Row: VideoTag;
        Insert: VideoTag;
        Update: Partial<VideoTag>;
        Relationships: [];
      };
      transcript_segments: {
        Row: TranscriptSegment;
        Insert: Omit<TranscriptSegment, "id">;
        Update: Partial<Omit<TranscriptSegment, "id">>;
        Relationships: [];
      };
      subscribers: {
        Row: Subscriber;
        Insert: Omit<Subscriber, "id" | "subscribed_at">;
        Update: Partial<Omit<Subscriber, "id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export interface Channel {
  id: string;
  youtube_channel_id: string;
  name: string;
  url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Video {
  id: string;
  youtube_id: string;
  channel_id: string | null;
  category_id: string | null;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  published_at: string | null;
  added_at: string;
  status: "draft" | "published";
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  curator_note: string | null;
  ai_summary: string | null;
  key_takeaways: string[];
  chapters: Chapter[];
  formatted_transcript: FormattedSection[] | null;
  view_count: number;
  search_vector: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  title: string;
  start_time: number;
}

export interface FormattedSection {
  heading: string;
  start_time: number;
  end_time: number;
  paragraphs: string[];
}

export interface VideoTag {
  video_id: string;
  tag_id: string;
}

export interface TranscriptSegment {
  id: string;
  video_id: string;
  start_time: number;
  end_time: number;
  text: string;
  order_index: number;
  section_header: string | null;
  starts_new_paragraph: boolean;
}

export interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
  confirmed: boolean;
}
