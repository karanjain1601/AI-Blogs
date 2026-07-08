import { describe, it, expect } from "vitest";
import { blocksToMarkdown } from "../content/export";
import type { Block } from "@notes/blocks";

describe("blocksToMarkdown", () => {
  it("returns empty string for empty block array", () => {
    expect(blocksToMarkdown([])).toBe("");
  });

  it("renders a text block as its content unchanged", () => {
    const block: Block = { type: "text", content: "Hello, world!" };
    expect(blocksToMarkdown([block])).toBe("Hello, world!");
  });

  it("renders a heading block with the correct number of # marks", () => {
    const h1: Block = { type: "heading", level: 1, content: "Title" };
    const h2: Block = { type: "heading", level: 2, content: "Subtitle" };
    const h3: Block = { type: "heading", level: 3, content: "Section" };
    expect(blocksToMarkdown([h1])).toBe("# Title");
    expect(blocksToMarkdown([h2])).toBe("## Subtitle");
    expect(blocksToMarkdown([h3])).toBe("### Section");
  });

  it("renders a code block as a fenced code block with language", () => {
    const block: Block = {
      type: "code",
      language: "typescript",
      content: "const x = 1;",
    };
    expect(blocksToMarkdown([block])).toBe(
      "```typescript\nconst x = 1;\n```",
    );
  });

  it("renders an unordered list block with dashes", () => {
    const block: Block = {
      type: "list",
      ordered: false,
      items: ["Alpha", "Beta", "Gamma"],
    };
    expect(blocksToMarkdown([block])).toBe("- Alpha\n- Beta\n- Gamma");
  });

  it("renders an ordered list block with numbers", () => {
    const block: Block = {
      type: "list",
      ordered: true,
      items: ["First", "Second", "Third"],
    };
    expect(blocksToMarkdown([block])).toBe("1. First\n2. Second\n3. Third");
  });

  it("renders a divider block as ---", () => {
    const block: Block = { type: "divider" };
    expect(blocksToMarkdown([block])).toBe("---");
  });

  it("joins multiple blocks with double newlines", () => {
    const blocks: Block[] = [
      { type: "heading", level: 1, content: "Intro" },
      { type: "text", content: "Some prose here." },
      { type: "divider" },
    ];
    expect(blocksToMarkdown(blocks)).toBe(
      "# Intro\n\nSome prose here.\n\n---",
    );
  });

  it("renders a quote block with optional citation", () => {
    const withCite: Block = {
      type: "quote",
      content: "Be yourself",
      cite: "Oscar Wilde",
    };
    const withoutCite: Block = { type: "quote", content: "Just a quote" };
    expect(blocksToMarkdown([withCite])).toBe(
      "> Be yourself\n>\n> — Oscar Wilde",
    );
    expect(blocksToMarkdown([withoutCite])).toBe("> Just a quote");
  });

  it("renders a callout block with title or variant as bold header", () => {
    const block: Block = {
      type: "callout",
      variant: "warning",
      title: "Heads up",
      content: "Be careful here.",
    };
    expect(blocksToMarkdown([block])).toBe("> **Heads up**\n> Be careful here.");
  });

  it("renders a table block as a markdown table", () => {
    const block: Block = {
      type: "table",
      headers: ["Name", "Age"],
      rows: [["Alice", "30"], ["Bob", "25"]],
    };
    const result = blocksToMarkdown([block]);
    expect(result).toContain("| Name | Age |");
    expect(result).toContain("| --- | --- |");
    expect(result).toContain("| Alice | 30 |");
    expect(result).toContain("| Bob | 25 |");
  });

  it("renders a todo block with checkbox syntax", () => {
    const block: Block = {
      type: "todo",
      items: [
        { text: "Buy milk", checked: true },
        { text: "Write tests", checked: false },
      ],
    };
    expect(blocksToMarkdown([block])).toBe(
      "- [x] Buy milk\n- [ ] Write tests",
    );
  });

  it("renders an image block as markdown image with optional caption", () => {
    const withCaption: Block = {
      type: "image",
      src: "https://example.com/img.png",
      alt: "A picture",
      caption: "A nice picture",
    };
    const result = blocksToMarkdown([withCaption]);
    expect(result).toContain("![A picture](https://example.com/img.png)");
    expect(result).toContain("*A nice picture*");
  });

  it("renders details block as HTML details/summary", () => {
    const block: Block = {
      type: "details",
      summary: "Click to expand",
      blocks: [{ type: "text", content: "Hidden content" }],
    };
    const result = blocksToMarkdown([block]);
    expect(result).toContain("<details>");
    expect(result).toContain("<summary>Click to expand</summary>");
    expect(result).toContain("Hidden content");
    expect(result).toContain("</details>");
  });
});
