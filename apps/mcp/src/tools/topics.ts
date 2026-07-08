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

type TopicRow = { id: string; slug: string; name: string; icon: string | null; parent_id: string | null; sort_order: number; description: string | null };

export function registerTopicTools(server: McpServer, getClient: () => AdminClient) {
  server.tool(
    "topics_list",
    "List all topics in the topic tree.",
    {},
    async () => {
      try {
        const supa = getClient();
        const { data, error } = await q<TopicRow[]>(
          supa.from("topics").select("id,slug,name,icon,parent_id,sort_order,description").order("sort_order"),
        );
        if (error) return err(error.message);
        return ok(data ?? []);
      } catch (e) {
        return err((e as Error).message);
      }
    },
  );

  server.tool(
    "topics_create",
    "Create a new topic in the topic tree.",
    {
      slug: z.string(),
      name: z.string(),
      parent_slug: z.string().optional(),
      icon: z.string().optional(),
      description: z.string().optional(),
      sort_order: z.number().default(0).optional(),
    },
    async ({ slug, name, parent_slug, icon, description, sort_order }) => {
      try {
        const supa = getClient();

        let parentId: string | null = null;
        if (parent_slug) {
          const { data: parent } = await q<{ id: string }>(
            supa.from("topics").select("id").eq("slug", parent_slug).single(),
          );
          parentId = parent?.id ?? null;
        }

        const { data, error } = await q<{ id: string }>(
          supa
            .from("topics")
            .insert({ slug, name, parent_id: parentId, icon, description, sort_order: sort_order ?? 0 } as never)
            .select("id")
            .single(),
        );

        if (error || !data) return err(error?.message ?? "Failed to create");
        return ok({ id: data.id, slug, name });
      } catch (e) {
        return err((e as Error).message);
      }
    },
  );

  server.tool(
    "topics_update",
    "Update a topic's name, slug, parent, icon, or description.",
    {
      slug: z.string(),
      name: z.string().optional(),
      new_slug: z.string().optional(),
      parent_slug: z.string().optional().describe("New parent (empty string = make root)"),
      icon: z.string().optional(),
      description: z.string().optional(),
      sort_order: z.number().optional(),
    },
    async ({ slug, name, new_slug, parent_slug, icon, description, sort_order }) => {
      try {
        const supa = getClient();
        const updates: Record<string, unknown> = {};
        if (name) updates.name = name;
        if (new_slug) updates.slug = new_slug;
        if (icon !== undefined) updates.icon = icon;
        if (description !== undefined) updates.description = description;
        if (sort_order !== undefined) updates.sort_order = sort_order;
        if (parent_slug !== undefined) {
          if (parent_slug === "") {
            updates.parent_id = null;
          } else {
            const { data: parent } = await q<{ id: string }>(
              supa.from("topics").select("id").eq("slug", parent_slug).single(),
            );
            updates.parent_id = parent?.id ?? null;
          }
        }

        const { error } = await q<never>(
          supa.from("topics").update(updates as never).eq("slug", slug),
        );
        if (error) return err(error.message);
        return ok({ updated: true, slug: new_slug ?? slug });
      } catch (e) {
        return err((e as Error).message);
      }
    },
  );

  server.tool(
    "topics_delete",
    "Delete a topic. Notes in this topic will have topic_id set to null.",
    { slug: z.string() },
    async ({ slug }) => {
      try {
        const supa = getClient();
        const { error } = await q<never>(supa.from("topics").delete().eq("slug", slug));
        if (error) return err(error.message);
        return ok({ deleted: true, slug });
      } catch (e) {
        return err((e as Error).message);
      }
    },
  );
}
