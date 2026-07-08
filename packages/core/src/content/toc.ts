import type { BlocksDocument } from "@notes/blocks";

export interface TocEntry {
  level: number;
  text: string;
  id: string;
}

/** URL-safe anchor id from heading text. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Build a table of contents from a note's top-level heading blocks. */
export function buildToc(blocks: BlocksDocument): TocEntry[] {
  const toc: TocEntry[] = [];
  for (const b of blocks) {
    if (b.type === "heading") {
      toc.push({
        level: b.level,
        text: b.content,
        id: b.id ?? slugify(b.content),
      });
    }
  }
  return toc;
}
