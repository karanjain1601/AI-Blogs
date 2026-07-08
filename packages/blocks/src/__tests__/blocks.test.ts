import { describe, it, expect } from "vitest";
import {
  parseBlocks,
  safeParseBlocks,
  isBlockType,
  BLOCK_TYPES,
  BlockSchema,
  BlocksDocumentSchema,
} from "../schema";
import type { Block, BlocksDocument } from "../schema";

// ─── isBlockType ─────────────────────────────────────────────────────────────

describe("isBlockType", () => {
  it("returns true for every value in BLOCK_TYPES", () => {
    for (const t of BLOCK_TYPES) {
      expect(isBlockType(t)).toBe(true);
    }
  });

  it("returns false for unknown strings", () => {
    expect(isBlockType("invalid-type")).toBe(false);
    expect(isBlockType("")).toBe(false);
    expect(isBlockType("TEXT")).toBe(false); // case-sensitive
  });
});

// ─── BLOCK_TYPES completeness ────────────────────────────────────────────────

describe("BLOCK_TYPES", () => {
  const EXPECTED_TYPES = [
    "text", "heading", "code", "mermaid", "math", "image",
    "callout", "quote", "list", "todo", "table", "divider",
    "video", "gallery", "file", "embed", "embed-note",
    "collection", "toc", "columns", "tabs", "details",
  ] as const;

  it("contains all expected block type discriminants", () => {
    for (const t of EXPECTED_TYPES) {
      expect(BLOCK_TYPES).toContain(t);
    }
  });

  it("has 22 block types", () => {
    expect(BLOCK_TYPES).toHaveLength(22);
  });
});

// ─── parseBlocks ─────────────────────────────────────────────────────────────

describe("parseBlocks", () => {
  it("parses a valid text block", () => {
    const result = parseBlocks([{ type: "text", content: "Hello" }]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: "text", content: "Hello" });
  });

  it("parses a valid heading block", () => {
    const result = parseBlocks([{ type: "heading", level: 2, content: "Hi" }]);
    expect(result[0]).toMatchObject({ type: "heading", level: 2 });
  });

  it("parses a code block (applies default language)", () => {
    const result = parseBlocks([{ type: "code", content: "x = 1" }]);
    expect(result[0]).toMatchObject({ type: "code", language: "text" });
  });

  it("parses an empty array as an empty document", () => {
    expect(parseBlocks([])).toEqual([]);
  });

  it("parses multiple mixed blocks", () => {
    const input = [
      { type: "text", content: "Intro" },
      { type: "divider" },
      { type: "heading", level: 1, content: "Title" },
    ];
    const result = parseBlocks(input);
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe("text");
    expect(result[1].type).toBe("divider");
    expect(result[2].type).toBe("heading");
  });

  it("throws on an invalid block type", () => {
    expect(() => parseBlocks([{ type: "not-a-real-type" }])).toThrow();
  });

  it("throws when a required field is missing (heading without level)", () => {
    expect(() =>
      parseBlocks([{ type: "heading", content: "No level" }]),
    ).toThrow();
  });

  it("throws when input is not an array", () => {
    expect(() => parseBlocks({ type: "text", content: "oops" })).toThrow();
  });
});

// ─── safeParseBlocks ─────────────────────────────────────────────────────────

describe("safeParseBlocks", () => {
  it("returns success=true for a valid block array", () => {
    const result = safeParseBlocks([{ type: "text", content: "OK" }]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({ type: "text", content: "OK" });
    }
  });

  it("returns success=false for an invalid block", () => {
    const result = safeParseBlocks([{ type: "unknown-block" }]);
    expect(result.success).toBe(false);
  });

  it("returns success=false for a non-array input", () => {
    const result = safeParseBlocks("not an array");
    expect(result.success).toBe(false);
  });

  it("does not throw on invalid input", () => {
    expect(() => safeParseBlocks([{ type: "bad" }])).not.toThrow();
  });
});

// ─── BlockSchema (individual block validation) ────────────────────────────────

describe("BlockSchema", () => {
  it("parses a valid list block with ordered default false", () => {
    const result = BlockSchema.safeParse({ type: "list", items: ["a", "b"] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({ type: "list", ordered: false });
    }
  });

  it("parses a valid callout block with variant default", () => {
    const result = BlockSchema.safeParse({
      type: "callout",
      content: "Watch out",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({ type: "callout", variant: "note" });
    }
  });

  it("fails on image block with invalid src URL", () => {
    const result = BlockSchema.safeParse({
      type: "image",
      src: "not-a-url",
      alt: "test",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional id on any block", () => {
    const result = BlockSchema.safeParse({
      type: "text",
      content: "With id",
      id: "block-123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const block = result.data as Block & { id?: string };
      expect(block.id).toBe("block-123");
    }
  });
});

// ─── BlocksDocumentSchema (round-trip) ───────────────────────────────────────

describe("BlocksDocumentSchema", () => {
  it("round-trips a complex document", () => {
    const doc: BlocksDocument = [
      { type: "heading", level: 1, content: "Notes" },
      { type: "text", content: "Introduction." },
      {
        type: "list",
        ordered: false,
        items: ["item one", "item two"],
      },
      { type: "divider" },
      {
        type: "code",
        language: "python",
        content: "print('hello')",
      },
    ];
    const result = BlocksDocumentSchema.safeParse(doc);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(5);
    }
  });
});
