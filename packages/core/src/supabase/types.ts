import type { BlocksDocument } from "@notes/blocks";

/** Note lifecycle. `scheduled` becomes `published` via a cron on `publish_at`. */
export type NoteStatus = "draft" | "scheduled" | "published" | "evergreen";

export type LinkKind = "link" | "embed";

export interface NoteRow {
  id: string;
  slug: string;
  aliases: string[] | null;
  title: string;
  summary: string | null;
  icon: string | null;
  cover_image: string | null;
  topic_id: string | null;
  parent_note_id: string | null;
  tags: string[] | null;
  status: NoteStatus;
  publish_at: string | null;
  sort_order: number;
  blocks: BlocksDocument;
  metadata: Record<string, unknown>;
  reading_time: number;
  view_count: number;
  preview_token: string;
  created_at: string;
  updated_at: string;
}

export interface TopicRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  cover_image: string | null;
  parent_id: string | null;
  sort_order: number;
}

export interface NoteLinkRow {
  source_note_id: string;
  target_note_id: string;
  link_kind: LinkKind;
}

export interface NoteRevisionRow {
  id: string;
  note_id: string;
  title: string;
  blocks: BlocksDocument;
  created_at: string;
}

export interface ReactionRow {
  note_id: string;
  emoji: string;
  count: number;
}

/** Shape consumed by `createClient<Database>()` from @supabase/supabase-js. */
export interface Database {
  public: {
    Tables: {
      notes: {
        Row: NoteRow;
        Insert: Partial<NoteRow> & { slug: string; title: string };
        Update: Partial<NoteRow>;
      };
      topics: {
        Row: TopicRow;
        Insert: Partial<TopicRow> & { slug: string; name: string };
        Update: Partial<TopicRow>;
      };
      note_links: {
        Row: NoteLinkRow;
        Insert: NoteLinkRow;
        Update: Partial<NoteLinkRow>;
      };
      note_revisions: {
        Row: NoteRevisionRow;
        Insert: Partial<NoteRevisionRow> & {
          note_id: string;
          title: string;
          blocks: BlocksDocument;
        };
        Update: Partial<NoteRevisionRow>;
      };
      reactions: {
        Row: ReactionRow;
        Insert: ReactionRow;
        Update: Partial<ReactionRow>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_view: { Args: { p_note_id: string }; Returns: undefined };
      increment_reaction: {
        Args: { p_note_id: string; p_emoji: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
