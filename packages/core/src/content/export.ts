import type { Block } from "@notes/blocks";

export function blocksToMarkdown(blocks: Block[]): string {
  return blocks.map(blockToMd).filter(Boolean).join("\n\n");
}

function blockToMd(block: Block): string {
  switch (block.type) {
    case "text":
      return block.content;
    case "heading":
      return `${"#".repeat(block.level)} ${block.content}`;
    case "code":
      return `\`\`\`${block.language ?? ""}\n${block.content}\n\`\`\``;
    case "math":
      return block.display ? `$$\n${block.content}\n$$` : `$${block.content}$`;
    case "image":
      return `![${block.alt}](${block.src})${block.caption ? `\n*${block.caption}*` : ""}`;
    case "callout":
      return `> **${block.title ?? block.variant}**\n> ${block.content}`;
    case "quote":
      return `> ${block.content}${block.cite ? `\n>\n> — ${block.cite}` : ""}`;
    case "list":
      return block.items
        .map((item, i) => (block.ordered ? `${i + 1}. ${item}` : `- ${item}`))
        .join("\n");
    case "todo":
      return block.items
        .map((item) => `- [${item.checked ? "x" : " "}] ${item.text}`)
        .join("\n");
    case "table": {
      const header = `| ${block.headers.join(" | ")} |`;
      const sep = `| ${block.headers.map(() => "---").join(" | ")} |`;
      const rows = block.rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
      return `${header}\n${sep}\n${rows}`;
    }
    case "divider":
      return "---";
    case "mermaid":
      return `\`\`\`mermaid\n${block.content}\n\`\`\``;
    case "video":
      return `[▶ Video](${block.src})`;
    case "file":
      return `[📎 ${block.name}](${block.src})`;
    case "embed":
      return `[Embed](${block.url})`;
    case "details":
      return `<details>\n<summary>${block.summary}</summary>\n\n${blocksToMarkdown(block.blocks)}\n\n</details>`;
    case "columns":
      return block.columns.map((c) => blocksToMarkdown(c.blocks)).join("\n\n");
    case "tabs":
      return block.tabs
        .map((t) => `**${t.label}**\n\n${blocksToMarkdown(t.blocks)}`)
        .join("\n\n");
    default:
      return "";
  }
}
