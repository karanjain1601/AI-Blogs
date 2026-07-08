import type { Block, BlocksDocument } from "@notes/blocks";

export interface WikiLink {
  /** target note slug */
  target: string;
  /** optional alias/display text from `[[slug|Display]]` */
  display?: string;
  /** optional `#heading` or `^blockId` anchor */
  anchor?: string;
  /** true for `![[...]]` transclusion embeds */
  embed: boolean;
}

// Matches [[slug]], [[slug|Display]], [[slug#heading]], ![[slug^blockId]], etc.
const WIKILINK_RE = /(!?)\[\[([^\]]+)\]\]/g;

/** Parse all wiki-links out of a single string of text. */
export function parseWikiLinks(text: string): WikiLink[] {
  const links: WikiLink[] = [];
  for (const match of text.matchAll(WIKILINK_RE)) {
    const embed = match[1] === "!";
    let body = match[2].trim();

    let display: string | undefined;
    const pipe = body.indexOf("|");
    if (pipe !== -1) {
      display = body.slice(pipe + 1).trim();
      body = body.slice(0, pipe).trim();
    }

    let anchor: string | undefined;
    const anchorIdx = body.search(/[#^]/);
    if (anchorIdx !== -1) {
      anchor = body.slice(anchorIdx);
      body = body.slice(0, anchorIdx).trim();
    }

    if (body) links.push({ target: body, display, anchor, embed });
  }
  return links;
}

/**
 * Concatenate all human-readable text within a block tree — used for
 * full-text search, link extraction, and reading-time estimation.
 */
export function collectText(blocks: BlocksDocument): string {
  const parts: string[] = [];
  const walk = (bs: Block[]): void => {
    for (const b of bs) {
      switch (b.type) {
        case "text":
        case "quote":
        case "callout":
        case "code":
        case "math":
        case "heading":
          parts.push(b.content);
          break;
        case "list":
          parts.push(b.items.join(" "));
          break;
        case "todo":
          parts.push(b.items.map((i) => i.text).join(" "));
          break;
        case "table":
          parts.push(b.headers.join(" "));
          for (const row of b.rows) parts.push(row.join(" "));
          break;
        case "details":
          parts.push(b.summary);
          walk(b.blocks);
          break;
        case "columns":
          for (const col of b.columns) walk(col.blocks);
          break;
        case "tabs":
          for (const tab of b.tabs) {
            parts.push(tab.label);
            walk(tab.blocks);
          }
          break;
        default:
          break;
      }
    }
  };
  walk(blocks);
  return parts.join("\n");
}

/** Extract every wiki-link (and transclusion) from a block tree. */
export function extractLinks(blocks: BlocksDocument): WikiLink[] {
  const links: WikiLink[] = [];
  const walk = (bs: Block[]): void => {
    for (const b of bs) {
      switch (b.type) {
        case "text":
        case "quote":
        case "callout":
        case "heading":
          links.push(...parseWikiLinks(b.content));
          break;
        case "list":
          for (const item of b.items) links.push(...parseWikiLinks(item));
          break;
        case "embed-note":
          links.push({ target: b.target, anchor: b.anchor, embed: true });
          break;
        case "details":
          links.push(...parseWikiLinks(b.summary));
          walk(b.blocks);
          break;
        case "columns":
          for (const col of b.columns) walk(col.blocks);
          break;
        case "tabs":
          for (const tab of b.tabs) walk(tab.blocks);
          break;
        default:
          break;
      }
    }
  };
  walk(blocks);
  return links;
}

export interface LinkEdge {
  target: string;
  kind: "link" | "embed";
}

/**
 * Distinct link/embed edges for a note, ready to upsert into `note_links`
 * (targets still need slug/alias → id resolution against the DB).
 */
export function linkEdges(blocks: BlocksDocument): LinkEdge[] {
  const seen = new Set<string>();
  const edges: LinkEdge[] = [];
  for (const link of extractLinks(blocks)) {
    const kind: "link" | "embed" = link.embed ? "embed" : "link";
    const key = `${kind}:${link.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ target: link.target, kind });
  }
  return edges;
}
