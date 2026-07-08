import { z } from "zod";
import { safeParseBlocks } from "@notes/blocks";
import { runSavePipeline } from "@notes/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AdminClient } from "../lib/supabase.js";

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
function err(msg: string) {
  return { content: [{ type: "text" as const, text: `ERROR: ${msg}` }], isError: true as const };
}

// supabase-js select-string typing collapses to never with hand-written DB types
function q<T>(promise: unknown): Promise<{ data: T | null; error: { message: string } | null }> {
  return promise as Promise<{ data: T | null; error: { message: string } | null }>;
}

type NoteRow = { id: string; slug: string; title: string; status: string; topic_id: string | null; reading_time: number; updated_at: string; summary: string | null; tags: string[] | null };
type NoteDetail = NoteRow & { aliases: string[] | null; icon: string | null; cover_image: string | null; blocks: unknown; metadata: unknown; view_count: number; preview_token: string; created_at: string };
type TopicRow = { id: string; slug: string; name: string };

export function registerNoteTools(server: McpServer, getClient: () => AdminClient) {
  const pipeline = () => ({
    revalidateUrl: process.env.WEB_REVALIDATE_URL,
    revalidateSecret: process.env.REVALIDATE_SECRET,
  });

  server.tool(
    "notes_list",
    "List notes with optional filters. Returns id, slug, title, status, topic_id, reading_time, updated_at.",
    {
      status: z.enum(["draft", "scheduled", "published", "evergreen"]).optional(),
      topic_slug: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(50).optional(),
    },
    async ({ status, topic_slug, search, limit }) => {
      try {
        const supa = getClient();
        let baseQ = supa
          .from("notes")
          .select("id,slug,title,status,topic_id,reading_time,updated_at,summary,tags")
          .order("updated_at", { ascending: false })
          .limit(limit ?? 50);

        if (status) baseQ = baseQ.eq("status", status) as typeof baseQ;
        if (search) baseQ = baseQ.ilike("title", `%${search}%`) as typeof baseQ;

        const { data, error } = await q<NoteRow[]>(baseQ);
        if (error) return err(error.message);

        let notes = data ?? [];

        if (topic_slug) {
          const { data: topic } = await q<TopicRow>(
            supa.from("topics").select("id").eq("slug", topic_slug).single(),
          );
          if (topic) notes = notes.filter((n) => n.topic_id === topic.id);
        }

        return ok(notes);
      } catch (e) {
        return err((e as Error).message);
      }
    },
  );

  server.tool(
    "notes_get",
    "Get a note's full content (including blocks JSON) by slug.",
    { slug: z.string() },
    async ({ slug }) => {
      try {
        const supa = getClient();
        const { data, error } = await q<NoteDetail>(
          supa.from("notes").select("*").eq("slug", slug).single(),
        );
        if (error || !data) return err("Note not found");
        return ok(data);
      } catch (e) {
        return err((e as Error).message);
      }
    },
  );

  server.tool(
    "notes_create",
    "Create a new note. Returns the new note's id and slug.",
    {
      title: z.string(),
      slug: z.string(),
      topic_slug: z.string().optional(),
      summary: z.string().optional(),
      tags: z.array(z.string()).optional(),
      status: z.enum(["draft", "published", "evergreen"]).default("draft").optional(),
      blocks: z.string().default("[]").optional().describe("JSON array of block objects"),
    },
    async ({ title, slug, topic_slug, summary, tags, status, blocks: blocksStr }) => {
      try {
        const supa = getClient();

        let topicId: string | null = null;
        if (topic_slug) {
          const { data: topic } = await q<TopicRow>(
            supa.from("topics").select("id").eq("slug", topic_slug).single(),
          );
          topicId = topic?.id ?? null;
        }

        const parsed = safeParseBlocks(JSON.parse(blocksStr ?? "[]"));
        if (!parsed.success) return err("Invalid blocks: " + parsed.error.message);

        const { data, error } = await q<{ id: string }>(
          supa
            .from("notes")
            .insert({
              title, slug, topic_id: topicId,
              summary: summary ?? null,
              tags: tags ?? [],
              status: status ?? "draft",
              blocks: parsed.data,
            } as never)
            .select("id")
            .single(),
        );

        if (error || !data) return err(error?.message ?? "Insert failed");
        await runSavePipeline(supa, data.id, slug, title, parsed.data, pipeline());
        return ok({ id: data.id, slug, title });
      } catch (e) {
        return err((e as Error).message);
      }
    },
  );

  server.tool(
    "notes_update",
    "Update an existing note's metadata or blocks.",
    {
      slug: z.string(),
      title: z.string().optional(),
      new_slug: z.string().optional(),
      summary: z.string().optional(),
      tags: z.array(z.string()).optional(),
      topic_slug: z.string().optional(),
      blocks: z.string().optional().describe("Full replacement blocks JSON"),
    },
    async ({ slug, title, new_slug, summary, tags, topic_slug, blocks: blocksStr }) => {
      try {
        const supa = getClient();
        const { data: note } = await q<{ id: string; title: string; slug: string; blocks: unknown }>(
          supa.from("notes").select("id,title,slug,blocks").eq("slug", slug).single(),
        );
        if (!note) return err("Note not found");

        const updates: Record<string, unknown> = {};
        if (title) updates.title = title;
        if (new_slug) updates.slug = new_slug;
        if (summary !== undefined) updates.summary = summary;
        if (tags) updates.tags = tags;

        if (topic_slug) {
          const { data: topic } = await q<TopicRow>(
            supa.from("topics").select("id").eq("slug", topic_slug).single(),
          );
          updates.topic_id = topic?.id ?? null;
        }

        let newBlocks = Array.isArray(note.blocks) ? note.blocks : [];
        if (blocksStr) {
          const parsed = safeParseBlocks(JSON.parse(blocksStr));
          if (!parsed.success) return err("Invalid blocks: " + parsed.error.message);
          newBlocks = parsed.data;
          updates.blocks = newBlocks;
        }

        const { error } = await q<never>(
          supa.from("notes").update(updates as never).eq("id", note.id),
        );
        if (error) return err(error.message);

        const finalSlug = new_slug ?? note.slug;
        const finalTitle = title ?? note.title;
        await runSavePipeline(supa, note.id, finalSlug, finalTitle, newBlocks, pipeline());
        return ok({ updated: true, id: note.id, slug: finalSlug });
      } catch (e) {
        return err((e as Error).message);
      }
    },
  );

  server.tool(
    "notes_delete",
    "Permanently delete a note by slug.",
    { slug: z.string() },
    async ({ slug }) => {
      try {
        const supa = getClient();
        const { error } = await q<never>(supa.from("notes").delete().eq("slug", slug));
        if (error) return err(error.message);
        return ok({ deleted: true, slug });
      } catch (e) {
        return err((e as Error).message);
      }
    },
  );

  server.tool(
    "notes_publish",
    "Change a note's status (draft → published → evergreen etc.).",
    {
      slug: z.string(),
      status: z.enum(["draft", "scheduled", "published", "evergreen"]),
    },
    async ({ slug, status }) => {
      try {
        const supa = getClient();
        const { error } = await q<never>(
          supa.from("notes").update({ status } as never).eq("slug", slug),
        );
        if (error) return err(error.message);
        return ok({ slug, status });
      } catch (e) {
        return err((e as Error).message);
      }
    },
  );
}
