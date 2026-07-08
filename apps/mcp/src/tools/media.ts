import { z } from "zod";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AdminClient } from "../lib/supabase.js";

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
function err(msg: string) {
  return { content: [{ type: "text" as const, text: `ERROR: ${msg}` }], isError: true as const };
}

const MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
  pdf: "application/pdf", mp4: "video/mp4",
};

export function registerMediaTools(server: McpServer, getClient: () => AdminClient) {
  server.tool(
    "media_upload",
    "Upload a local file to Supabase Storage and return its public CDN URL.",
    {
      file_path: z.string().describe("Absolute path to the local file to upload"),
      bucket: z.string().default("media").optional().describe("Storage bucket name"),
      destination: z.string().optional().describe("Custom path in the bucket (auto-generated if omitted)"),
    },
    async ({ file_path, bucket, destination }) => {
      try {
        const supa = getClient();
        const buffer = await readFile(file_path);
        const filename = basename(file_path);
        const ext = filename.split(".").pop()?.toLowerCase() ?? "bin";
        const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "bin";
        const path = destination ?? `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
        const contentType = MIME[safeExt] ?? "application/octet-stream";

        const { error } = await supa.storage
          .from(bucket ?? "media")
          .upload(path, buffer, { contentType, upsert: false });

        if (error) return err(error.message);

        const { data } = supa.storage.from(bucket ?? "media").getPublicUrl(path);
        return ok({ url: data.publicUrl, path });
      } catch (e) {
        return err((e as Error).message);
      }
    },
  );
}
