import type { Block } from "@notes/blocks";

export interface TopicView {
  slug: string;
  name: string;
  icon: string | null;
  parentSlug: string | null;
  sortOrder: number;
  description: string | null;
}

export interface NoteView {
  slug: string;
  title: string;
  summary: string | null;
  topicSlug: string | null;
  tags: string[];
  blocks: Block[];
  updatedAt: string | null;
  readingTime: number;
}

export interface SearchResult {
  slug: string;
  title: string;
  summary: string | null;
  topicSlug: string | null;
}
