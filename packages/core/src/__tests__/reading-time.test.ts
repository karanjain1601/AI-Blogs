import { describe, it, expect } from "vitest";
import { readingTime, countWords } from "../content/reading-time";
import type { Block } from "@notes/blocks";

// Helper: build a text block
function textBlock(content: string): Block {
  return { type: "text", content };
}

// Helper: repeat a word N times to produce a block with exactly N words
function wordsBlock(n: number): Block {
  return textBlock(Array.from({ length: n }, () => "word").join(" "));
}

describe("countWords", () => {
  it("returns 0 for empty string", () => {
    expect(countWords("")).toBe(0);
  });

  it("returns 0 for whitespace-only string", () => {
    expect(countWords("   ")).toBe(0);
  });

  it("counts single word", () => {
    expect(countWords("hello")).toBe(1);
  });

  it("counts multiple words", () => {
    expect(countWords("one two three")).toBe(3);
  });

  it("handles multiple spaces between words", () => {
    expect(countWords("one  two   three")).toBe(3);
  });
});

describe("readingTime", () => {
  it("returns 1 for empty blocks (minimum floor)", () => {
    expect(readingTime([])).toBe(1);
  });

  it("returns 1 for a very short text block (below threshold)", () => {
    // 3 words / 220 wpm → rounds to 0 → Math.max(1, 0) = 1
    expect(readingTime([textBlock("one two three")])).toBe(1);
  });

  it("returns 1 for exactly 110 words (110/220 = 0.5 → rounds to 1)", () => {
    expect(readingTime([wordsBlock(110)])).toBe(1);
  });

  it("returns 2 for exactly 440 words (440/220 = 2)", () => {
    expect(readingTime([wordsBlock(440)])).toBe(2);
  });

  it("returns 3 for 660 words (660/220 = 3)", () => {
    expect(readingTime([wordsBlock(660)])).toBe(3);
  });

  it("aggregates words across multiple text blocks", () => {
    // Two blocks of 220 words each → 440 total → 2 min
    expect(readingTime([wordsBlock(220), wordsBlock(220)])).toBe(2);
  });

  it("collects text from heading blocks", () => {
    const heading: Block = { type: "heading", level: 2, content: "My Heading" };
    // 2 words in heading only → still rounds to 1 min
    expect(readingTime([heading])).toBe(1);
  });

  it("collects text from code blocks", () => {
    const code: Block = { type: "code", language: "ts", content: "const x = 1" };
    // 3 tokens → still 1 min
    expect(readingTime([code])).toBe(1);
  });

  it("collects words from list blocks", () => {
    const list: Block = { type: "list", ordered: false, items: ["alpha", "beta"] };
    // items joined with space → "alpha beta" = 2 words
    expect(readingTime([list])).toBe(1);
  });

  it("respects custom wpm argument", () => {
    // 100 words at 50 wpm = 2 min
    expect(readingTime([wordsBlock(100)], 50)).toBe(2);
  });
});
