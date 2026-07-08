import { z } from "zod";

/**
 * The canonical block schema — the single contract shared by every surface
 * (web reader, mobile reader, admin editor). A note's `blocks` column is an
 * array of these typed objects. See Plan/plan.md → "Block Types".
 *
 * Every block may carry an optional `id`, used for deep-linking and as the
 * anchor for block-level transclusion (`![[note^id]]`).
 */

const withId = { id: z.string().optional() };

/* ────────────────────────────── Leaf blocks ────────────────────────────── */

export const TextBlockSchema = z.object({
  type: z.literal("text"),
  content: z.string(),
  ...withId,
});

export const HeadingBlockSchema = z.object({
  type: z.literal("heading"),
  level: z.number().int().min(1).max(6),
  content: z.string(),
  ...withId,
});

export const CodeBlockSchema = z.object({
  type: z.literal("code"),
  language: z.string().default("text"),
  filename: z.string().optional(),
  /** 1-indexed line numbers to highlight. */
  highlight: z.array(z.number().int().positive()).optional(),
  content: z.string(),
  ...withId,
});

export const MERMAID_LAYOUTS = ["tabs", "stacked", "split"] as const;

export const MermaidBlockSchema = z.object({
  type: z.literal("mermaid"),
  content: z.string(),
  title: z.string().optional(),
  layout: z.enum(MERMAID_LAYOUTS).default("tabs"),
  defaultTab: z.enum(["diagram", "source"]).default("diagram"),
  ...withId,
});

export const MathBlockSchema = z.object({
  type: z.literal("math"),
  content: z.string(),
  /** true = block/display math, false = inline. */
  display: z.boolean().default(true),
  ...withId,
});

export const ImageBlockSchema = z.object({
  type: z.literal("image"),
  src: z.string().url(),
  alt: z.string(),
  caption: z.string().optional(),
  ...withId,
});

export const CALLOUT_VARIANTS = ["info", "warning", "error", "tip", "note"] as const;

export const CalloutBlockSchema = z.object({
  type: z.literal("callout"),
  variant: z.enum(CALLOUT_VARIANTS).default("note"),
  title: z.string().optional(),
  content: z.string(),
  ...withId,
});

export const QuoteBlockSchema = z.object({
  type: z.literal("quote"),
  content: z.string(),
  cite: z.string().optional(),
  ...withId,
});

export const ListBlockSchema = z.object({
  type: z.literal("list"),
  ordered: z.boolean().default(false),
  items: z.array(z.string()),
  ...withId,
});

export const TodoBlockSchema = z.object({
  type: z.literal("todo"),
  items: z.array(
    z.object({ text: z.string(), checked: z.boolean().default(false) }),
  ),
  ...withId,
});

export const TableBlockSchema = z.object({
  type: z.literal("table"),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  ...withId,
});

export const DividerBlockSchema = z.object({
  type: z.literal("divider"),
  ...withId,
});

export const VideoBlockSchema = z.object({
  type: z.literal("video"),
  src: z.string().url(),
  poster: z.string().url().optional(),
  caption: z.string().optional(),
  ...withId,
});

export const GalleryBlockSchema = z.object({
  type: z.literal("gallery"),
  images: z.array(z.object({ src: z.string().url(), alt: z.string() })),
  ...withId,
});

export const FileBlockSchema = z.object({
  type: z.literal("file"),
  src: z.string().url(),
  name: z.string(),
  size: z.string().optional(),
  ...withId,
});

export const EMBED_PROVIDERS = ["youtube", "vimeo", "tweet", "codepen", "generic"] as const;

export const EmbedBlockSchema = z.object({
  type: z.literal("embed"),
  provider: z.enum(EMBED_PROVIDERS).default("generic"),
  url: z.string().url(),
  ...withId,
});

/** Transclusion — embed another note / heading / block (Obsidian `![[...]]`). */
export const EmbedNoteBlockSchema = z.object({
  type: z.literal("embed-note"),
  /** target note slug */
  target: z.string(),
  /** optional `#heading` or `^blockId` anchor within the target */
  anchor: z.string().optional(),
  ...withId,
});

export const COLLECTION_VIEWS = ["table", "board", "gallery", "list"] as const;

/** A live, filtered view over notes (Notion linked-database). */
export const CollectionBlockSchema = z.object({
  type: z.literal("collection"),
  view: z.enum(COLLECTION_VIEWS).default("list"),
  filter: z.record(z.string(), z.unknown()).optional(),
  groupBy: z.string().optional(),
  sort: z.string().optional(),
  ...withId,
});

export const TocBlockSchema = z.object({
  type: z.literal("toc"),
  ...withId,
});

/* ─────────────────────── Container blocks (recursive) ────────────────────── */
// These nest other blocks, so their TS types are declared explicitly and their
// Zod schemas reference `BlockSchema` lazily to break the cycle.

export type TextBlock = z.infer<typeof TextBlockSchema>;
export type HeadingBlock = z.infer<typeof HeadingBlockSchema>;
export type CodeBlock = z.infer<typeof CodeBlockSchema>;
export type MermaidBlock = z.infer<typeof MermaidBlockSchema>;
export type MathBlock = z.infer<typeof MathBlockSchema>;
export type ImageBlock = z.infer<typeof ImageBlockSchema>;
export type CalloutBlock = z.infer<typeof CalloutBlockSchema>;
export type QuoteBlock = z.infer<typeof QuoteBlockSchema>;
export type ListBlock = z.infer<typeof ListBlockSchema>;
export type TodoBlock = z.infer<typeof TodoBlockSchema>;
export type TableBlock = z.infer<typeof TableBlockSchema>;
export type DividerBlock = z.infer<typeof DividerBlockSchema>;
export type VideoBlock = z.infer<typeof VideoBlockSchema>;
export type GalleryBlock = z.infer<typeof GalleryBlockSchema>;
export type FileBlock = z.infer<typeof FileBlockSchema>;
export type EmbedBlock = z.infer<typeof EmbedBlockSchema>;
export type EmbedNoteBlock = z.infer<typeof EmbedNoteBlockSchema>;
export type CollectionBlock = z.infer<typeof CollectionBlockSchema>;
export type TocBlock = z.infer<typeof TocBlockSchema>;

export interface ColumnsBlock {
  type: "columns";
  columns: { blocks: Block[] }[];
  id?: string;
}

export interface TabsBlock {
  type: "tabs";
  tabs: { label: string; blocks: Block[] }[];
  id?: string;
}

export interface DetailsBlock {
  type: "details";
  summary: string;
  blocks: Block[];
  id?: string;
}

export const ColumnsBlockSchema: z.ZodType<ColumnsBlock, z.ZodTypeDef, unknown> = z.object({
  type: z.literal("columns"),
  columns: z.array(z.object({ blocks: z.array(z.lazy(() => BlockSchema)) })),
  id: z.string().optional(),
});

export const TabsBlockSchema: z.ZodType<TabsBlock, z.ZodTypeDef, unknown> = z.object({
  type: z.literal("tabs"),
  tabs: z.array(
    z.object({ label: z.string(), blocks: z.array(z.lazy(() => BlockSchema)) }),
  ),
  id: z.string().optional(),
});

export const DetailsBlockSchema: z.ZodType<DetailsBlock, z.ZodTypeDef, unknown> = z.object({
  type: z.literal("details"),
  summary: z.string(),
  blocks: z.array(z.lazy(() => BlockSchema)),
  id: z.string().optional(),
});

/* ─────────────────────────────── The union ──────────────────────────────── */

export type Block =
  | TextBlock
  | HeadingBlock
  | CodeBlock
  | MermaidBlock
  | MathBlock
  | ImageBlock
  | CalloutBlock
  | QuoteBlock
  | ListBlock
  | TodoBlock
  | TableBlock
  | DividerBlock
  | VideoBlock
  | GalleryBlock
  | FileBlock
  | EmbedBlock
  | EmbedNoteBlock
  | CollectionBlock
  | TocBlock
  | ColumnsBlock
  | TabsBlock
  | DetailsBlock;

export type BlockType = Block["type"];

export const BLOCK_TYPES = [
  "text",
  "heading",
  "code",
  "mermaid",
  "math",
  "image",
  "callout",
  "quote",
  "list",
  "todo",
  "table",
  "divider",
  "video",
  "gallery",
  "file",
  "embed",
  "embed-note",
  "collection",
  "toc",
  "columns",
  "tabs",
  "details",
] as const satisfies readonly BlockType[];

export const BlockSchema: z.ZodType<Block, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.union([
    TextBlockSchema,
    HeadingBlockSchema,
    CodeBlockSchema,
    MermaidBlockSchema,
    MathBlockSchema,
    ImageBlockSchema,
    CalloutBlockSchema,
    QuoteBlockSchema,
    ListBlockSchema,
    TodoBlockSchema,
    TableBlockSchema,
    DividerBlockSchema,
    VideoBlockSchema,
    GalleryBlockSchema,
    FileBlockSchema,
    EmbedBlockSchema,
    EmbedNoteBlockSchema,
    CollectionBlockSchema,
    TocBlockSchema,
    ColumnsBlockSchema,
    TabsBlockSchema,
    DetailsBlockSchema,
  ]),
);

/** A note's full content: an ordered array of blocks. */
export const BlocksDocumentSchema = z.array(BlockSchema);
export type BlocksDocument = Block[];

/* ─────────────────────────────── Helpers ────────────────────────────────── */

/** Parse + validate untrusted block data; throws on invalid input. */
export function parseBlocks(input: unknown): BlocksDocument {
  return BlocksDocumentSchema.parse(input);
}

/** Non-throwing variant; returns a Zod SafeParseReturn. */
export function safeParseBlocks(input: unknown) {
  return BlocksDocumentSchema.safeParse(input);
}

/** True if `value` is a valid block type string. */
export function isBlockType(value: string): value is BlockType {
  return (BLOCK_TYPES as readonly string[]).includes(value);
}
