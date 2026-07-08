import type { SupabaseClient } from "@supabase/supabase-js";
import type { Block } from "@notes/blocks";
import { readingTime } from "../content/reading-time.js";
import { linkEdges } from "../content/wikilinks.js";
import type { Database } from "../supabase/types.js";

export interface SavePipelineOptions {
  revalidateUrl?: string;
  revalidateSecret?: string;
}

export interface SavePipelineResult {
  readingTime: number;
  linksProcessed: number;
  revisionId: string | null;
  revalidated: boolean;
}

/**
 * Shared write-path logic for admin site and MCP server.
 * Recomputes derived fields, rebuilds note_links, snapshots a revision,
 * and optionally triggers ISR revalidation on the web app.
 */
export async function runSavePipeline(
  supabase: SupabaseClient<Database>,
  noteId: string,
  noteSlug: string,
  noteTitle: string,
  blocks: Block[],
  opts: SavePipelineOptions = {},
): Promise<SavePipelineResult> {
  const rt = readingTime(blocks);
  const edges = linkEdges(blocks);

  let linksProcessed = 0;
  if (edges.length > 0) {
    const targetSlugs = [...new Set(edges.map((e) => e.target))];

    // supabase-js select-string types collapse to never with hand-written DB types
    const { data: targets } = await (supabase
      .from("notes")
      .select("id,slug")
      .in("slug", targetSlugs) as unknown as Promise<{
        data: { id: string; slug: string }[] | null;
        error: unknown;
      }>);

    const slugToId = new Map((targets ?? []).map((n) => [n.slug, n.id]));

    await supabase.from("note_links").delete().eq("source_note_id", noteId);

    const rows = edges
      .map((e) => ({
        source_note_id: noteId,
        target_note_id: slugToId.get(e.target) ?? null,
        link_kind: e.kind as "link" | "embed",
      }))
      .filter(
        (r): r is {
          source_note_id: string;
          target_note_id: string;
          link_kind: "link" | "embed";
        } => r.target_note_id !== null,
      );

    if (rows.length > 0) {
      await (supabase.from("note_links").insert(
        rows as unknown as never[],
      ) as unknown as Promise<unknown>);
      linksProcessed = rows.length;
    }
  }

  // Snapshot revision
  let revisionId: string | null = null;
  const { data: rev } = await (supabase
    .from("note_revisions")
    .insert({
      note_id: noteId,
      title: noteTitle,
      blocks: blocks as unknown as never,
    } as unknown as never)
    .select("id")
    .single() as unknown as Promise<{ data: { id: string } | null; error: unknown }>);
  revisionId = rev?.id ?? null;

  // Update reading_time on the note
  await supabase.from("notes").update({ reading_time: rt } as never).eq("id", noteId);

  // Trigger ISR revalidation (non-fatal)
  let revalidated = false;
  if (opts.revalidateUrl && opts.revalidateSecret) {
    try {
      const resp = await fetch(opts.revalidateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-revalidate-secret": opts.revalidateSecret,
        },
        body: JSON.stringify({ slug: noteSlug }),
      });
      revalidated = resp.ok;
    } catch {
      // Non-fatal — next ISR cycle will pick it up
    }
  }

  return { readingTime: rt, linksProcessed, revisionId, revalidated };
}
