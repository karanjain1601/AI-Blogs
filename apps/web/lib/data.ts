import { createSupabaseClient } from "@notes/core";
import { safeParseBlocks, type Block } from "@notes/blocks";
import type { NoteView, TopicView, ReactionCount, Author, GraphData, GraphNode, GraphEdge } from "./types";
import { FIXTURE_NOTES, FIXTURE_TOPICS } from "./fixtures";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supa = url && key ? createSupabaseClient(url, key) : null;

/** True when running on bundled fixtures (no Supabase configured yet). */
export const usingFixtures = !supa;

function toBlocks(input: unknown): Block[] {
  const result = safeParseBlocks(input);
  return result.success ? result.data : [];
}

/* ─────────────────────────────── Queries ──────────────────────────────── */

export async function getTopics(): Promise<TopicView[]> {
  if (!supa) return FIXTURE_TOPICS;
  const { data, error } = await supa
    .from("topics")
    .select("id,slug,name,icon,parent_id,sort_order,description")
    .order("sort_order");
  if (error || !data) return [];
  const rows = data as unknown as RawTopic[];
  const idToSlug = new Map(rows.map((t) => [t.id, t.slug]));
  return rows.map((t) => ({
    slug: t.slug,
    name: t.name,
    icon: t.icon,
    parentSlug: t.parent_id ? idToSlug.get(t.parent_id) ?? null : null,
    sortOrder: t.sort_order,
    description: t.description,
  }));
}

interface RawTopic {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  sort_order: number;
  description: string | null;
}

export async function getNotes(): Promise<NoteView[]> {
  if (!supa) return FIXTURE_NOTES;
  const { data, error } = await supa
    .from("notes")
    .select(
      "id,slug,title,summary,tags,blocks,updated_at,reading_time,topic:topics(slug),author:authors(id,name,slug,bio,avatar_url,website_url,twitter_handle,github_handle)",
    )
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return (data as unknown as RawNote[]).map(rowToNote);
}

export async function getNoteBySlug(slug: string): Promise<NoteView | null> {
  if (!supa) return FIXTURE_NOTES.find((n) => n.slug === slug) ?? null;
  const { data, error } = await supa
    .from("notes")
    .select(
      "id,slug,title,summary,tags,blocks,updated_at,reading_time,topic:topics(slug),author:authors(id,name,slug,bio,avatar_url,website_url,twitter_handle,github_handle)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return rowToNote(data as unknown as RawNote);
}

interface RawNote {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  tags: string[] | null;
  blocks: unknown;
  updated_at: string | null;
  reading_time: number | null;
  topic: { slug: string } | { slug: string }[] | null;
  author: {
    id: string;
    name: string;
    slug: string;
    bio: string | null;
    avatar_url: string | null;
    website_url: string | null;
    twitter_handle: string | null;
    github_handle: string | null;
  } | {
    id: string;
    name: string;
    slug: string;
    bio: string | null;
    avatar_url: string | null;
    website_url: string | null;
    twitter_handle: string | null;
    github_handle: string | null;
  }[] | null;
}

function rowToNote(row: RawNote): NoteView {
  const topic = Array.isArray(row.topic) ? row.topic[0] : row.topic;
  const a = Array.isArray(row.author) ? row.author[0] : row.author;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    topicSlug: topic?.slug ?? null,
    tags: row.tags ?? [],
    blocks: toBlocks(row.blocks),
    updatedAt: row.updated_at,
    readingTime: row.reading_time ?? 0,
    author: a ? {
      id: a.id,
      name: a.name,
      slug: a.slug,
      bio: a.bio,
      avatarUrl: a.avatar_url,
      websiteUrl: a.website_url,
      twitterHandle: a.twitter_handle,
      githubHandle: a.github_handle,
    } : null,
  };
}

/* ───────────────────────────── Pure helpers ───────────────────────────── */

export function childTopics(
  parentSlug: string | null,
  topics: TopicView[],
): TopicView[] {
  return topics
    .filter((t) => t.parentSlug === parentSlug)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function notesInTopic(topicSlug: string, notes: NoteView[]): NoteView[] {
  return notes.filter((n) => n.topicSlug === topicSlug);
}

/** Root → leaf chain of topics for a given topic slug. */
export function topicChain(
  topicSlug: string | null,
  topics: TopicView[],
): TopicView[] {
  const bySlug = new Map(topics.map((t) => [t.slug, t]));
  const chain: TopicView[] = [];
  let current = topicSlug ? bySlug.get(topicSlug) : undefined;
  const guard = new Set<string>();
  while (current && !guard.has(current.slug)) {
    guard.add(current.slug);
    chain.unshift(current);
    current = current.parentSlug ? bySlug.get(current.parentSlug) : undefined;
  }
  return chain;
}

/** Canonical nested URL path segments for a note: topic chain + note slug. */
export function notePath(note: NoteView, topics: TopicView[]): string[] {
  return [...topicChain(note.topicSlug, topics).map((t) => t.slug), note.slug];
}

export function notePathHref(note: NoteView, topics: TopicView[]): string {
  return `/notes/${notePath(note, topics).join("/")}`;
}

export interface NoteLink {
  slug: string;
  title: string;
  summary: string | null;
}

export interface SearchResult {
  slug: string;
  title: string;
  summary: string | null;
  tags: string[];
  topicSlug: string | null;
}

export async function getBacklinks(noteSlug: string): Promise<NoteLink[]> {
  if (!supa) return [];
  const { data: noteRow } = await (supa
    .from("notes")
    .select("id")
    .eq("slug", noteSlug)
    .maybeSingle() as unknown as Promise<{ data: { id: string } | null; error: unknown }>);
  if (!noteRow) return [];
  const { data: linkRows } = await (supa
    .from("note_links")
    .select("source_note_id")
    .eq("target_note_id", noteRow.id) as unknown as Promise<{
    data: { source_note_id: string }[] | null;
    error: unknown;
  }>);
  if (!linkRows?.length) return [];
  const ids = linkRows.map((l) => l.source_note_id);
  const { data: notes } = await (supa
    .from("notes")
    .select("slug,title,summary")
    .in("id", ids) as unknown as Promise<{
    data: NoteLink[] | null;
    error: unknown;
  }>);
  return notes ?? [];
}

export async function getOutgoingLinks(noteSlug: string): Promise<NoteLink[]> {
  if (!supa) return [];
  const { data: noteRow } = await (supa
    .from("notes")
    .select("id")
    .eq("slug", noteSlug)
    .maybeSingle() as unknown as Promise<{ data: { id: string } | null; error: unknown }>);
  if (!noteRow) return [];
  const { data: linkRows } = await (supa
    .from("note_links")
    .select("target_note_id")
    .eq("source_note_id", noteRow.id) as unknown as Promise<{
    data: { target_note_id: string }[] | null;
    error: unknown;
  }>);
  if (!linkRows?.length) return [];
  const ids = linkRows.map((l) => l.target_note_id);
  const { data: notes } = await (supa
    .from("notes")
    .select("slug,title,summary")
    .in("id", ids) as unknown as Promise<{
    data: NoteLink[] | null;
    error: unknown;
  }>);
  return notes ?? [];
}

export async function searchNotes(query: string): Promise<SearchResult[]> {
  if (!supa || !query.trim()) return [];
  const { data } = await (supa
    .from("notes")
    .select("slug,title,summary,tags,topic:topics(slug)")
    .textSearch("fts", query, { type: "websearch", config: "english" })
    .in("status", ["published", "evergreen"])
    .limit(20) as unknown as Promise<{
    data: {
      slug: string;
      title: string;
      summary: string | null;
      tags: string[];
      topic: { slug: string } | null;
    }[] | null;
    error: unknown;
  }>);
  return (data ?? []).map((r) => ({
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    tags: r.tags,
    topicSlug: r.topic?.slug ?? null,
  }));
}

export async function getNoteByToken(token: string): Promise<NoteView | null> {
  if (!supa) return null;
  const { data, error } = await (supa
    .from("notes")
    .select("id,slug,title,summary,tags,blocks,updated_at,reading_time,topic:topics(slug),author:authors(id,name,slug,bio,avatar_url,website_url,twitter_handle,github_handle)")
    .eq("preview_token", token)
    .maybeSingle() as unknown as Promise<{ data: RawNote | null; error: unknown }>);
  if (error || !data) return null;
  return rowToNote(data);
}

export async function getReactions(noteId: string): Promise<ReactionCount[]> {
  if (!supa) return [];
  const { data } = await (supa
    .from("reactions")
    .select("emoji,count")
    .eq("note_id", noteId) as unknown as Promise<{
    data: ReactionCount[] | null;
    error: unknown;
  }>);
  return data ?? [];
}

export async function getAuthor(slug: string): Promise<Author | null> {
  if (!supa) return null;
  const { data } = await (supa
    .from("authors")
    .select("id,name,slug,bio,avatar_url,website_url,twitter_handle,github_handle")
    .eq("slug", slug)
    .maybeSingle() as unknown as Promise<{
    data: {
      id: string; name: string; slug: string; bio: string | null;
      avatar_url: string | null; website_url: string | null;
      twitter_handle: string | null; github_handle: string | null;
    } | null;
    error: unknown;
  }>);
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    bio: data.bio,
    avatarUrl: data.avatar_url,
    websiteUrl: data.website_url,
    twitterHandle: data.twitter_handle,
    githubHandle: data.github_handle,
  };
}

export async function getAuthorNotes(authorId: string): Promise<NoteView[]> {
  if (!supa) return [];
  const { data } = await (supa
    .from("notes")
    .select("id,slug,title,summary,tags,blocks,updated_at,reading_time,topic:topics(slug),author:authors(id,name,slug,bio,avatar_url,website_url,twitter_handle,github_handle)")
    .eq("author_id", authorId)
    .in("status", ["published", "evergreen"])
    .order("updated_at", { ascending: false }) as unknown as Promise<{
    data: RawNote[] | null;
    error: unknown;
  }>);
  return (data ?? []).map(rowToNote);
}

export async function getGraphData(): Promise<GraphData> {
  if (!supa) return { nodes: [], edges: [] };

  const [notesResult, linksResult] = await Promise.all([
    supa
      .from("notes")
      .select("id,slug,title,topic:topics(slug)")
      .in("status", ["published", "evergreen"]) as unknown as Promise<{
      data: { id: string; slug: string; title: string; topic: { slug: string } | null }[] | null;
      error: unknown;
    }>,
    supa
      .from("note_links")
      .select("source_note_id,target_note_id") as unknown as Promise<{
      data: { source_note_id: string; target_note_id: string }[] | null;
      error: unknown;
    }>,
  ]);

  const rawNotes = notesResult.data ?? [];
  const rawLinks = linksResult.data ?? [];

  const noteIds = new Set(rawNotes.map((n) => n.id));
  const linkCountMap = new Map<string, number>();
  for (const l of rawLinks) {
    linkCountMap.set(l.source_note_id, (linkCountMap.get(l.source_note_id) ?? 0) + 1);
    linkCountMap.set(l.target_note_id, (linkCountMap.get(l.target_note_id) ?? 0) + 1);
  }

  const nodes: GraphNode[] = rawNotes.map((n) => ({
    id: n.id,
    slug: n.slug,
    title: n.title,
    topicSlug: n.topic?.slug ?? null,
    linkCount: linkCountMap.get(n.id) ?? 0,
  }));

  const edges: GraphEdge[] = rawLinks
    .filter((l) => noteIds.has(l.source_note_id) && noteIds.has(l.target_note_id))
    .map((l) => ({ source: l.source_note_id, target: l.target_note_id }));

  return { nodes, edges };
}
