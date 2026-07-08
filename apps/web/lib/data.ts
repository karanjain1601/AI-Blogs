import { createSupabaseClient } from "@notes/core";
import { safeParseBlocks, type Block } from "@notes/blocks";
import type { NoteView, TopicView } from "./types";
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
      "slug,title,summary,tags,blocks,updated_at,reading_time,topic:topics(slug)",
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
      "slug,title,summary,tags,blocks,updated_at,reading_time,topic:topics(slug)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return rowToNote(data as unknown as RawNote);
}

interface RawNote {
  slug: string;
  title: string;
  summary: string | null;
  tags: string[] | null;
  blocks: unknown;
  updated_at: string | null;
  reading_time: number | null;
  topic: { slug: string } | { slug: string }[] | null;
}

function rowToNote(row: RawNote): NoteView {
  const topic = Array.isArray(row.topic) ? row.topic[0] : row.topic;
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    topicSlug: topic?.slug ?? null,
    tags: row.tags ?? [],
    blocks: toBlocks(row.blocks),
    updatedAt: row.updated_at,
    readingTime: row.reading_time ?? 0,
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
  const q = query.trim();
  const { data } = await (supa
    .from("notes")
    .select("slug,title,summary,topic:topics(slug)")
    .or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
    .in("status", ["published", "evergreen"])
    .limit(20) as unknown as Promise<{
    data:
      | {
          slug: string;
          title: string;
          summary: string | null;
          topic: { slug: string } | { slug: string }[] | null;
        }[]
      | null;
    error: unknown;
  }>);
  return (data ?? []).map((row) => {
    const topic = Array.isArray(row.topic) ? row.topic[0] : row.topic;
    return {
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      topicSlug: topic?.slug ?? null,
    };
  });
}
