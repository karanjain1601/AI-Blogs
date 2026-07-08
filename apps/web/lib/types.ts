import type { Block } from "@notes/blocks";

export interface TopicView {
  slug: string;
  name: string;
  icon: string | null;
  parentSlug: string | null;
  sortOrder: number;
  description?: string | null;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  twitterHandle: string | null;
  githubHandle: string | null;
}

export interface NoteView {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  topicSlug: string | null;
  tags: string[];
  blocks: Block[];
  updatedAt: string | null;
  readingTime: number;
  previewToken?: string;
  author?: Author | null;
}

export interface ReactionCount {
  emoji: string;
  count: number;
}

export interface GraphNode {
  id: string;
  slug: string;
  title: string;
  topicSlug: string | null;
  linkCount: number;
}

export interface GraphEdge {
  source: string;  // note id
  target: string;  // note id
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
