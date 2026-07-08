import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AdminClient } from "../lib/supabase.js";

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
function err(msg: string) {
  return { content: [{ type: "text" as const, text: `ERROR: ${msg}` }], isError: true as const };
}

function q<T>(promise: unknown): Promise<{ data: T | null; error: { message: string } | null }> {
  return promise as Promise<{ data: T | null; error: { message: string } | null }>;
}

type SearchRow = { id: string; slug: string; title: string; summary: string | null; status: string; updated_at: string };
type LinkRow = { source_note_id: string; link_kind: string };

export function registerSearchTools(server: McpServer, getClient: () => AdminClient) {
  server.tool(
    "search",
    "Full-text search over note titles and summaries.",
    {
      query: z.string().describe("Search query"),
      limit: z.number().min(1).max(50).default(20).optional(),
    },
    async ({ query, limit }) => {
      try {
        const supa = getClient();
        const { data, error } = await q<SearchRow[]>(
          supa
            .from("notes")
            .select("id,slug,title,summary,status,updated_at")
            .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
            .order("updated_at", { ascending: false })
            .limit(limit ?? 20),
        );
        if (error) return err(error.message);
        return ok(data ?? []);
      } catch (e) {
        return err((e as Error).message);
      }
    },
  );

  server.tool(
    "backlinks_get",
    "Get all notes that link to a given note slug.",
    { slug: z.string() },
    async ({ slug }) => {
      try {
        const supa = getClient();

        const { data: target } = await q<{ id: string }>(
          supa.from("notes").select("id").eq("slug", slug).single(),
        );
        if (!target) return err("Note not found");

        const { data: links, error } = await q<LinkRow[]>(
          supa
            .from("note_links")
            .select("source_note_id,link_kind")
            .eq("target_note_id", target.id),
        );
        if (error) return err(error.message);
        if (!links || links.length === 0) return ok({ backlinks: [] });

        const sourceIds = links.map((l) => l.source_note_id);
        const { data: notes } = await q<{ id: string; slug: string; title: string; status: string }[]>(
          supa.from("notes").select("id,slug,title,status").in("id", sourceIds),
        );

        const result = (notes ?? []).map((n) => ({
          ...n,
          link_kind: links.find((l) => l.source_note_id === n.id)?.link_kind,
        }));

        return ok({ target_slug: slug, backlinks: result });
      } catch (e) {
        return err((e as Error).message);
      }
    },
  );
}
