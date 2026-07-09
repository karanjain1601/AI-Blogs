import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseClient, blocksToMarkdown } from "@notes/core";
import type { Block } from "@notes/blocks";

interface RawNote {
  slug: string;
  title: string;
  summary: string | null;
  tags: string[];
  blocks: Block[];
  updated_at: string | null;
  status: string;
  topic: { slug: string } | null;
}

function noteToMarkdown(note: RawNote): string {
  const lines = [
    "---",
    `title: ${JSON.stringify(note.title)}`,
    `slug: "${note.slug}"`,
  ];
  if (note.summary) lines.push(`description: ${JSON.stringify(note.summary)}`);
  if (note.tags.length)
    lines.push(`tags: [${note.tags.map((t) => JSON.stringify(t)).join(", ")}]`);
  if (note.topic) lines.push(`topic: "${note.topic.slug}"`);
  lines.push(`status: "${note.status}"`);
  if (note.updated_at) lines.push(`updated: "${note.updated_at.slice(0, 10)}"`);
  // base64 blocks JSON — used by restore to reconstruct the exact block structure
  lines.push(`blocks_json: "${Buffer.from(JSON.stringify(note.blocks)).toString("base64")}"`);
  lines.push("---", "", `# ${note.title}`, "", blocksToMarkdown(note.blocks));
  return lines.join("\n");
}

function notePath(note: RawNote): string {
  const dir = note.topic?.slug ?? "_uncategorized";
  return `notes/${dir}/${note.slug}.md`;
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
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

async function createBlob(repo: string, token: string, content: string): Promise<string> {
  const data = (await ghFetch("POST", `repos/${repo}/git/blobs`, token, {
    content: Buffer.from(content, "utf8").toString("base64"),
    encoding: "base64",
  })) as { sha: string };
  return data.sha;
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ghToken = process.env.GITHUB_BACKUP_TOKEN;
  const ghRepo = process.env.GITHUB_BACKUP_REPO;
  const ghBranch = process.env.GITHUB_BACKUP_BRANCH ?? "main";

  if (!ghToken || !ghRepo) {
    return NextResponse.json(
      { error: "Set GITHUB_BACKUP_TOKEN and GITHUB_BACKUP_REPO to enable GitHub backup." },
      { status: 503 },
    );
  }

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supaUrl || !supaKey) return NextResponse.json({ error: "no_db" }, { status: 503 });

  const supa = createSupabaseClient(supaUrl, supaKey);
  const { data: notes } = await (supa
    .from("notes")
    .select("slug,title,summary,tags,blocks,updated_at,status,topic:topics(slug)")
    .in("status", ["published", "evergreen"])
    .order("updated_at", { ascending: false }) as unknown as Promise<{
    data: RawNote[] | null;
    error: unknown;
  }>);

  if (!notes) return NextResponse.json({ error: "fetch_failed" }, { status: 500 });

  // ── Get branch tip ────────────────────────────────────────────
  const refData = (await ghFetch(
    "GET",
    `repos/${ghRepo}/git/ref/heads/${ghBranch}`,
    ghToken,
  )) as { object: { sha: string } } | null;

  if (!refData) {
    return NextResponse.json(
      {
        error: `Branch '${ghBranch}' not found in ${ghRepo}. Create the repo and an initial commit first.`,
      },
      { status: 404 },
    );
  }

  const headSha = refData.object.sha;
  const headCommit = (await ghFetch(
    "GET",
    `repos/${ghRepo}/git/commits/${headSha}`,
    ghToken,
  )) as { tree: { sha: string } };
  const baseTreeSha = headCommit.tree.sha;

  // ── Discover existing notes/ for deletion detection ──────────
  const fullTree = (await ghFetch(
    "GET",
    `repos/${ghRepo}/git/trees/${baseTreeSha}?recursive=1`,
    ghToken,
  )) as { tree: { path: string; type: string }[] } | null;

  const existingNotePaths = new Set<string>(
    (fullTree?.tree ?? [])
      .filter((item) => item.type === "blob" && item.path.startsWith("notes/"))
      .map((item) => item.path),
  );

  // ── Create blobs for all notes (batched) ─────────────────────
  const currentPaths = new Map(notes.map((n) => [notePath(n), n]));
  const BATCH = 20;
  const noteEntries: { path: string; sha: string }[] = [];
  const noteList = [...currentPaths.entries()];

  for (let i = 0; i < noteList.length; i += BATCH) {
    const batch = noteList.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async ([path, note]) => ({
        path,
        sha: await createBlob(ghRepo, ghToken, noteToMarkdown(note)),
      })),
    );
    noteEntries.push(...results);
  }

  // ── Auto-generate README index ────────────────────────────────
  const topicSet = new Set(notes.map((n) => n.topic?.slug ?? "_uncategorized"));
  const readmeMd = [
    "# Notes Backup",
    "",
    `> Auto-generated. Last synced: ${new Date().toISOString().slice(0, 10)}`,
    "",
    `**${notes.length} notes** across **${topicSet.size} topics**`,
    "",
    "| Title | Topic | Updated |",
    "| ----- | ----- | ------- |",
    ...notes.map(
      (n) =>
        `| [${n.title}](${notePath(n)}) | ${n.topic?.slug ?? "—"} | ${n.updated_at?.slice(0, 10) ?? "—"} |`,
    ),
  ].join("\n");

  const readmeSha = await createBlob(ghRepo, ghToken, readmeMd);

  // ── Build tree (upsert current + null-out deleted) ────────────
  type TreeEntry = { path: string; mode: string; type: string; sha: string | null };
  const treeEntries: TreeEntry[] = [
    { path: "README.md", mode: "100644", type: "blob", sha: readmeSha },
    ...noteEntries.map((e) => ({ path: e.path, mode: "100644", type: "blob", sha: e.sha })),
  ];

  let deletedCount = 0;
  for (const existing of existingNotePaths) {
    if (!currentPaths.has(existing)) {
      treeEntries.push({ path: existing, mode: "100644", type: "blob", sha: null });
      deletedCount++;
    }
  }

  // ── Commit ────────────────────────────────────────────────────
  const newTree = (await ghFetch("POST", `repos/${ghRepo}/git/trees`, ghToken, {
    base_tree: baseTreeSha,
    tree: treeEntries,
  })) as { sha: string };

  const newCommit = (await ghFetch("POST", `repos/${ghRepo}/git/commits`, ghToken, {
    message: `backup: ${notes.length} notes (${new Date().toISOString().slice(0, 10)})`,
    tree: newTree.sha,
    parents: [headSha],
  })) as { sha: string };

  await ghFetch("PATCH", `repos/${ghRepo}/git/refs/heads/${ghBranch}`, ghToken, {
    sha: newCommit.sha,
    force: false,
  });

  return NextResponse.json({
    ok: true,
    committed: notes.length,
    deleted: deletedCount,
    commit: newCommit.sha.slice(0, 7),
    repo: ghRepo,
    branch: ghBranch,
  });
}
