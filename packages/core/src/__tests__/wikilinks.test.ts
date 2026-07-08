import { describe, it, expect } from "vitest";
import {
  parseWikiLinks,
  collectText,
  extractLinks,
  linkEdges,
} from "../content/wikilinks";
import type { Block, BlocksDocument } from "@notes/blocks";

// ─── parseWikiLinks ──────────────────────────────────────────────────────────

describe("parseWikiLinks", () => {
  it("returns empty array for text with no wikilinks", () => {
    expect(parseWikiLinks("just plain text")).toEqual([]);
  });

  it("parses a simple [[Target]] link", () => {
    const links = parseWikiLinks("See [[SomeNote]] for details");
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ target: "SomeNote", embed: false });
  });

  it("parses an embed ![[Target]]", () => {
    const links = parseWikiLinks("![[EmbeddedNote]]");
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ target: "EmbeddedNote", embed: true });
  });

  it("parses alias [[Target|Display text]]", () => {
    const links = parseWikiLinks("[[MyNote|Click here]]");
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      target: "MyNote",
      display: "Click here",
      embed: false,
    });
  });

  it("parses heading anchor [[Note#Section]]", () => {
    const links = parseWikiLinks("[[Guide#Setup]]");
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      target: "Guide",
      anchor: "#Setup",
      embed: false,
    });
  });

  it("parses multiple wikilinks in one string", () => {
    const links = parseWikiLinks("Read [[Alpha]] and [[Beta]] then ![[Gamma]]");
    expect(links).toHaveLength(3);
    expect(links[0]).toMatchObject({ target: "Alpha", embed: false });
    expect(links[1]).toMatchObject({ target: "Beta", embed: false });
    expect(links[2]).toMatchObject({ target: "Gamma", embed: true });
  });
});

// ─── collectText ─────────────────────────────────────────────────────────────

describe("collectText", () => {
  it("returns empty string for empty document", () => {
    expect(collectText([])).toBe("");
  });

  it("collects content from a text block", () => {
    const blocks: BlocksDocument = [{ type: "text", content: "Hello world" }];
    expect(collectText(blocks)).toContain("Hello world");
  });

  it("collects content from heading, code, and quote blocks", () => {
    const blocks: BlocksDocument = [
      { type: "heading", level: 1, content: "Title" },
      { type: "code", language: "ts", content: "const x = 1" },
      { type: "quote", content: "Famous quote" },
    ];
    const text = collectText(blocks);
    expect(text).toContain("Title");
    expect(text).toContain("const x = 1");
    expect(text).toContain("Famous quote");
  });

  it("joins list items from a list block", () => {
    const blocks: BlocksDocument = [
      { type: "list", ordered: false, items: ["apple", "banana"] },
    ];
    const text = collectText(blocks);
    expect(text).toContain("apple");
    expect(text).toContain("banana");
  });

  it("recurses into details blocks", () => {
    const blocks: BlocksDocument = [
      {
        type: "details",
        summary: "Summary text",
        blocks: [{ type: "text", content: "Inner content" }],
      },
    ];
    const text = collectText(blocks);
    expect(text).toContain("Summary text");
    expect(text).toContain("Inner content");
  });
});

// ─── linkEdges ───────────────────────────────────────────────────────────────

describe("linkEdges", () => {
  it("returns empty array when no wikilinks exist", () => {
    const blocks: BlocksDocument = [{ type: "text", content: "no links here" }];
    expect(linkEdges(blocks)).toEqual([]);
  });

  it("returns a link edge for [[TargetNote]]", () => {
    const blocks: BlocksDocument = [
      { type: "text", content: "See [[TargetNote]]" },
    ];
    const edges = linkEdges(blocks);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toEqual({ target: "TargetNote", kind: "link" });
  });

  it("returns an embed edge for ![[EmbeddedNote]]", () => {
    const blocks: BlocksDocument = [
      { type: "text", content: "![[EmbeddedNote]]" },
    ];
    const edges = linkEdges(blocks);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toEqual({ target: "EmbeddedNote", kind: "embed" });
  });

  it("returns both link and embed edges from a single block", () => {
    const blocks: BlocksDocument = [
      { type: "text", content: "See [[Alpha]] and ![[Beta]]" },
    ];
    const edges = linkEdges(blocks);
    expect(edges).toHaveLength(2);
    expect(edges).toContainEqual({ target: "Alpha", kind: "link" });
    expect(edges).toContainEqual({ target: "Beta", kind: "embed" });
  });

  it("deduplicates identical link edges", () => {
    const blocks: BlocksDocument = [
      { type: "text", content: "[[Dupe]] and [[Dupe]] again" },
    ];
    const edges = linkEdges(blocks);
    // Same target + same kind → should appear only once
    expect(edges).toHaveLength(1);
    expect(edges[0]).toEqual({ target: "Dupe", kind: "link" });
  });

  it("treats same target with different kinds as distinct edges", () => {
    const blocks: BlocksDocument = [
      { type: "text", content: "[[Note]] and ![[Note]]" },
    ];
    const edges = linkEdges(blocks);
    expect(edges).toHaveLength(2);
    expect(edges).toContainEqual({ target: "Note", kind: "link" });
    expect(edges).toContainEqual({ target: "Note", kind: "embed" });
  });

  it("extracts links from heading blocks", () => {
    const blocks: BlocksDocument = [
      { type: "heading", level: 2, content: "Related to [[OtherNote]]" },
    ];
    const edges = linkEdges(blocks);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toEqual({ target: "OtherNote", kind: "link" });
  });

  it("handles embed-note block as an embed edge", () => {
    const block: Block = { type: "embed-note", target: "TranscludedNote" };
    const edges = linkEdges([block]);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toEqual({ target: "TranscludedNote", kind: "embed" });
  });
});
