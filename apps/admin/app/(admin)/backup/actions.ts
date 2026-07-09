"use server";
import { requireSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase";
import { blocksToMarkdown } from "@notes/core";
import { safeParseBlocks } from "@notes/blocks";
import type { Block } from "@notes/blocks";

// ── Types ────────────────────────────────────────────────────────────────────

interface RawNote {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  tags: string[];
  blocks: Block[];
  updated_at: string | null;
  status: string;
  topic: { slug: string } | null;
}

interface TopicRow {
  id: string;
  slug: string;
  name: string;
}

export interface ActionResult {
  ok: boolean;
  message: string;
  detail?: string;
}

// ── GitHub helpers ────────────────────────────────────────────────────────────

function ghConfig() {
  const token = process.env.GITHUB_BACKUP_TOKEN;
  const repo = process.env.GITHUB_BACKUP_REPO;
  const branch = process.env.GITHUB_BACKUP_BRANCH ?? "main";
  if (!token || !repo) return null;
  return { token, repo, branch };
}

async function ghFetch(
  method: string,
  path: string,
  token: string,
  body?: unknown,
): Promise<unknown> {
  const res = await fetch(`https://api.github.com/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${method} /${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

async function createBlob(repo: string, token: string, content: string) {
  const data = (await ghFetch("POST", `repos/${repo}/git/blobs`, token, {
    content: Buffer.from(content, "utf8").toString("base64"),
    encoding: "base64",
  })) as { sha: string };
  return data.sha;
}

// ── Markdown serialisation ────────────────────────────────────────────────────

function noteToMarkdown(note: RawNote): string {
  const lines = [
    "---",
    `title: ${JSON.stringify(note.title)}`,
    `slug: "${note.slug}"`,
  ];
  if (note.summary) lines.push(`description: ${JSON.stringify(note.summary)}`);
  if (note.tags?.length)
    lines.push(`tags: [${note.tags.map((t) => JSON.stringify(t)).join(", ")}]`);
  if (note.topic) lines.push(`topic: "${note.topic.slug}"`);
  lines.push(`status: "${note.status}"`);
  if (note.updated_at) lines.push(`updated: "${note.updated_at.slice(0, 10)}"`);
  lines.push(`blocks_json: "${Buffer.from(JSON.stringify(note.blocks)).toString("base64")}"`);
  lines.push("---", "", `# ${note.title}`, "", blocksToMarkdown(note.blocks));
  return lines.join("\n");
}

function notePath(note: Pick<RawNote, "slug" | "topic">) {
  return `notes/${note.topic?.slug ?? "_uncategorized"}/${note.slug}.md`;
}

// ── Frontmatter parser ────────────────────────────────────────────────────────

function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const stripped = raw.replace(/^﻿/, ""); // strip UTF-8 BOM written by PowerShell
  const match = stripped.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: stripped };
  const [, fm, body] = match;
  const data: Record<string, unknown> = {};
  for (const line of fm.split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const raw = line.slice(colon + 1).trim();
    if (raw.startsWith("[")) {
      try { data[key] = JSON.parse(raw); } catch { data[key] = []; }
    } else if (raw.startsWith('"') && raw.endsWith('"')) {
      data[key] = raw.slice(1, -1);
    } else {
      data[key] = raw;
    }
  }
  return { data, body: body.trim() };
}

// ── BACKUP ────────────────────────────────────────────────────────────────────

export async function backupAction(): Promise<ActionResult> {
  await requireSession();

  const gh = ghConfig();
  if (!gh) {
    return { ok: false, message: "GitHub backup not configured", detail: "Set GITHUB_BACKUP_TOKEN, GITHUB_BACKUP_REPO, and GITHUB_BACKUP_BRANCH env vars." };
  }

  const supa = createAdminClient();
  const { data: notes, error } = await (supa
    .from("notes")
    .select("id,slug,title,summary,tags,blocks,updated_at,status,topic:topics(slug)")
    .order("updated_at", { ascending: false }) as unknown as Promise<{
    data: RawNote[] | null;
    error: { message: string } | null;
  }>);

  if (error || !notes) return { ok: false, message: "Failed to fetch notes", detail: error?.message };

  // Get branch tip
  const refData = (await ghFetch("GET", `repos/${gh.repo}/git/ref/heads/${gh.branch}`, gh.token)) as { object: { sha: string } } | null;
  if (!refData) return { ok: false, message: `Branch '${gh.branch}' not found in ${gh.repo}` };

  const headSha = refData.object.sha;
  const headCommit = (await ghFetch("GET", `repos/${gh.repo}/git/commits/${headSha}`, gh.token)) as { tree: { sha: string } };
  const baseTreeSha = headCommit.tree.sha;

  // Discover existing notes for deletion detection
  const fullTree = (await ghFetch("GET", `repos/${gh.repo}/git/trees/${baseTreeSha}?recursive=1`, gh.token)) as { tree: { path: string; type: string }[] } | null;
  const existingPaths = new Set<string>((fullTree?.tree ?? []).filter((i) => i.type === "blob" && i.path.startsWith("notes/")).map((i) => i.path));

  // Batch create blobs
  const currentPaths = new Map(notes.map((n) => [notePath(n), n]));
  const BATCH = 20;
  const noteEntries: { path: string; sha: string }[] = [];
  const noteList = [...currentPaths.entries()];

  for (let i = 0; i < noteList.length; i += BATCH) {
    const results = await Promise.all(
      noteList.slice(i, i + BATCH).map(async ([path, note]) => ({
        path,
        sha: await createBlob(gh.repo, gh.token, noteToMarkdown(note)),
      })),
    );
    noteEntries.push(...results);
  }

  // README index
  const topicSet = new Set(notes.map((n) => n.topic?.slug ?? "_uncategorized"));
  const readmeMd = [
    "# Notes Backup",
    "",
    `> Last synced: ${new Date().toISOString().slice(0, 10)}`,
    "",
    `**${notes.length} notes** across **${topicSet.size} topics**`,
    "",
    "| Title | Status | Topic | Updated |",
    "| ----- | ------ | ----- | ------- |",
    ...notes.map((n) => `| [${n.title}](${notePath(n)}) | ${n.status} | ${n.topic?.slug ?? "—"} | ${n.updated_at?.slice(0, 10) ?? "—"} |`),
  ].join("\n");

  const readmeSha = await createBlob(gh.repo, gh.token, readmeMd);

  type TreeEntry = { path: string; mode: string; type: string; sha: string | null };
  const treeEntries: TreeEntry[] = [
    { path: "README.md", mode: "100644", type: "blob", sha: readmeSha },
    ...noteEntries.map((e) => ({ path: e.path, mode: "100644", type: "blob", sha: e.sha })),
  ];

  let deletedCount = 0;
  for (const existing of existingPaths) {
    if (!currentPaths.has(existing)) {
      treeEntries.push({ path: existing, mode: "100644", type: "blob", sha: null });
      deletedCount++;
    }
  }

  const newTree = (await ghFetch("POST", `repos/${gh.repo}/git/trees`, gh.token, { base_tree: baseTreeSha, tree: treeEntries })) as { sha: string };
  const newCommit = (await ghFetch("POST", `repos/${gh.repo}/git/commits`, gh.token, {
    message: `backup: ${notes.length} notes (${new Date().toISOString().slice(0, 10)})`,
    tree: newTree.sha,
    parents: [headSha],
  })) as { sha: string };
  await ghFetch("PATCH", `repos/${gh.repo}/git/refs/heads/${gh.branch}`, gh.token, { sha: newCommit.sha, force: false });

  return {
    ok: true,
    message: `Backed up ${notes.length} notes`,
    detail: `Commit ${newCommit.sha.slice(0, 7)} — ${deletedCount} deleted · ${gh.repo}@${gh.branch}`,
  };
}

// ── RESTORE ───────────────────────────────────────────────────────────────────

export async function restoreAction(): Promise<ActionResult> {
  await requireSession();

  const gh = ghConfig();
  if (!gh) {
    return { ok: false, message: "GitHub backup not configured", detail: "Set GITHUB_BACKUP_TOKEN, GITHUB_BACKUP_REPO, and GITHUB_BACKUP_BRANCH env vars." };
  }

  const supa = createAdminClient();

  // Get branch tip and full tree
  const refData = (await ghFetch("GET", `repos/${gh.repo}/git/ref/heads/${gh.branch}`, gh.token)) as { object: { sha: string } } | null;
  if (!refData) return { ok: false, message: `Branch '${gh.branch}' not found in ${gh.repo}` };

  const headCommit = (await ghFetch("GET", `repos/${gh.repo}/git/commits/${refData.object.sha}`, gh.token)) as { tree: { sha: string } };
  const fullTree = (await ghFetch("GET", `repos/${gh.repo}/git/trees/${headCommit.tree.sha}?recursive=1`, gh.token)) as { tree: { path: string; url: string; type: string }[] } | null;

  const mdFiles = (fullTree?.tree ?? []).filter((i) => i.type === "blob" && i.path.startsWith("notes/") && i.path.endsWith(".md"));
  if (!mdFiles.length) return { ok: false, message: "No note files found in backup repo" };

  // Fetch all topics for slug → id lookup
  const { data: existingTopics } = await (supa.from("topics").select("id,slug,name") as unknown as Promise<{ data: TopicRow[] | null }>);
  const topicMap = new Map((existingTopics ?? []).map((t) => [t.slug, t.id]));

  let restored = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const file of mdFiles) {
    try {
      const blob = (await ghFetch("GET", file.url.replace("https://api.github.com/", ""), gh.token)) as { content: string; encoding: string } | null;
      if (!blob) continue;

      const raw = Buffer.from(blob.content.replace(/\n/g, ""), "base64").toString("utf8");
      const { data: fm } = parseFrontmatter(raw);

      const slug = String(fm.slug ?? "");
      const title = String(fm.title ?? "");
      if (!slug || !title) { failed++; errors.push(`${file.path}: missing slug/title`); continue; }

      // Resolve topic
      let topicId: string | null = null;
      const topicSlug = fm.topic ? String(fm.topic) : null;
      if (topicSlug) {
        if (topicMap.has(topicSlug)) {
          topicId = topicMap.get(topicSlug)!;
        } else {
          // Create missing topic
          const { data: newTopic } = await (supa
            .from("topics")
            .insert({ slug: topicSlug, name: topicSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) } as never)
            .select("id")
            .single() as unknown as Promise<{ data: { id: string } | null }>);
          if (newTopic) { topicMap.set(topicSlug, newTopic.id); topicId = newTopic.id; }
        }
      }

      // Decode blocks from blocks_json if present
      let blocks: unknown[] = [];
      if (fm.blocks_json) {
        try {
          const decoded = Buffer.from(String(fm.blocks_json), "base64").toString("utf8");
          const parsed = safeParseBlocks(JSON.parse(decoded));
          if (parsed.success) blocks = parsed.data;
        } catch { /* fall back to empty blocks */ }
      }

      const noteData = {
        slug,
        title,
        summary: fm.description ? String(fm.description) : null,
        tags: Array.isArray(fm.tags) ? fm.tags : [],
        status: fm.status ? String(fm.status) : "draft",
        topic_id: topicId,
        blocks,
      };

      await (supa.from("notes").upsert(noteData as never, { onConflict: "slug" }) as unknown as Promise<unknown>);
      restored++;
    } catch (e) {
      failed++;
      errors.push(`${file.path}: ${(e as Error).message}`);
    }
  }

  const detail = [
    `${restored} restored, ${failed} failed`,
    ...(errors.length ? [`Errors: ${errors.slice(0, 3).join(" · ")}${errors.length > 3 ? ` +${errors.length - 3} more` : ""}`] : []),
  ].join(" · ");

  return { ok: failed === 0 || restored > 0, message: `Restored ${restored} of ${mdFiles.length} notes`, detail };
}
