import { createSupabaseClient } from "@notes/core";
import { safeParseBlocks, type Block } from "@notes/blocks";
import type { NoteView, TopicView, SearchResult } from "./types";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supa = url && key ? createSupabaseClient(url, key) : null;

export const usingFixtures = !supa;

function toBlocks(input: unknown): Block[] {
  const r = safeParseBlocks(input);
  return r.success ? r.data : [];
}

interface RawTopic {
  id: string; slug: string; name: string; icon: string | null;
  parent_id: string | null; sort_order: number; description: string | null;
}

interface RawNote {
  slug: string; title: string; summary: string | null; tags: string[] | null;
  blocks: unknown; updated_at: string | null; reading_time: number | null;
  topic: { slug: string } | { slug: string }[] | null;
}

function rowToNote(row: RawNote): NoteView {
  const topic = Array.isArray(row.topic) ? row.topic[0] : row.topic;
  return {
    slug: row.slug, title: row.title, summary: row.summary,
    topicSlug: topic?.slug ?? null,
    tags: row.tags ?? [],
    blocks: toBlocks(row.blocks),
    updatedAt: row.updated_at,
    readingTime: row.reading_time ?? 0,
  };
}

export async function getTopics(): Promise<TopicView[]> {
  if (!supa) return [];
  const { data, error } = await (supa.from("topics")
    .select("id,slug,name,icon,parent_id,sort_order,description")
    .order("sort_order") as unknown as Promise<{ data: RawTopic[] | null; error: unknown }>);
  if (error || !data) return [];
  const idToSlug = new Map(data.map((t) => [t.id, t.slug]));
  return data.map((t) => ({
    slug: t.slug, name: t.name, icon: t.icon,
    parentSlug: t.parent_id ? (idToSlug.get(t.parent_id) ?? null) : null,
    sortOrder: t.sort_order, description: t.description,
  }));
}

export async function getNotes(): Promise<NoteView[]> {
  if (!supa) return [];
  const { data, error } = await (supa.from("notes")
    .select("slug,title,summary,tags,blocks,updated_at,reading_time,topic:topics(slug)")
    .in("status", ["published", "evergreen"])
    .order("updated_at", { ascending: false }) as unknown as Promise<{ data: RawNote[] | null; error: unknown }>);
  if (error || !data) return [];
  return data.map(rowToNote);
}

export async function getNoteBySlug(slug: string): Promise<NoteView | null> {
  if (!supa) return null;
  const { data, error } = await (supa.from("notes")
    .select("slug,title,summary,tags,blocks,updated_at,reading_time,topic:topics(slug)")
    .eq("slug", slug)
    .maybeSingle() as unknown as Promise<{ data: RawNote | null; error: unknown }>);
  if (error || !data) return null;
  return rowToNote(data);
}

export async function getNotesInTopic(topicSlug: string): Promise<NoteView[]> {
  if (!supa) return [];
  const { data: topicRow } = await (supa.from("topics")
    .select("id").eq("slug", topicSlug).maybeSingle() as unknown as Promise<{ data: { id: string } | null; error: unknown }>);
  if (!topicRow) return [];
  const { data, error } = await (supa.from("notes")
    .select("slug,title,summary,tags,blocks,updated_at,reading_time,topic:topics(slug)")
    .eq("topic_id", topicRow.id)
    .in("status", ["published", "evergreen"])
    .order("title") as unknown as Promise<{ data: RawNote[] | null; error: unknown }>);
  if (error || !data) return [];
  return data.map(rowToNote);
}

export async function searchNotes(query: string): Promise<SearchResult[]> {
  if (!supa || !query.trim()) return [];
  const q = query.trim();
  const { data } = await (supa.from("notes")
    .select("slug,title,summary,topic:topics(slug)")
    .or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
    .in("status", ["published", "evergreen"])
    .limit(20) as unknown as Promise<{
      data: { slug: string; title: string; summary: string | null; topic: { slug: string } | { slug: string }[] | null }[] | null;
      error: unknown;
    }>);
  return (data ?? []).map((row) => {
    const topic = Array.isArray(row.topic) ? row.topic[0] : row.topic;
    return { slug: row.slug, title: row.title, summary: row.summary, topicSlug: topic?.slug ?? null };
  });
}

export function childTopics(parentSlug: string | null, topics: TopicView[]): TopicView[] {
  return topics.filter((t) => t.parentSlug === parentSlug).sort((a, b) => a.sortOrder - b.sortOrder);
}
