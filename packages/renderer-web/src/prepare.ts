import type { Block } from "@notes/blocks";
import katex from "katex";
import { renderMarkdown } from "./markdown";
import { highlightCode } from "./highlight";

/**
 * A block plus any HTML that had to be produced asynchronously on the server
 * (markdown, Shiki highlighting, KaTeX). Doing this once, up front, keeps the
 * React block components fully synchronous.
 */
export interface Prepared {
  block: Block;
  /** rendered HTML for text/callout/quote (markdown), code (shiki), math (katex) */
  html?: string;
  /** highlighted mermaid source */
  sourceHtml?: string;
  /** prepared children for `details` */
  children?: Prepared[];
  /** prepared columns for `columns` */
  columns?: Prepared[][];
  /** prepared tabs for `tabs` */
  tabs?: { label: string; children: Prepared[] }[];
}

export async function prepareBlock(block: Block): Promise<Prepared> {
  switch (block.type) {
    case "text":
    case "callout":
    case "quote":
      return { block, html: await renderMarkdown(block.content) };
    case "code":
      return { block, html: await highlightCode(block.content, block.language) };
    case "mermaid":
      return { block, sourceHtml: await highlightCode(block.content, "mermaid") };
    case "math":
      return {
        block,
        html: katex.renderToString(block.content, {
          displayMode: block.display,
          throwOnError: false,
        }),
      };
    case "details":
      return { block, children: await prepareBlocks(block.blocks) };
    case "columns":
      return {
        block,
        columns: await Promise.all(block.columns.map((c) => prepareBlocks(c.blocks))),
      };
    case "tabs":
      return {
        block,
        tabs: await Promise.all(
          block.tabs.map(async (t) => ({
            label: t.label,
            children: await prepareBlocks(t.blocks),
          })),
        ),
      };
    default:
      return { block };
  }
}

export async function prepareBlocks(blocks: Block[]): Promise<Prepared[]> {
  return Promise.all(blocks.map(prepareBlock));
}
