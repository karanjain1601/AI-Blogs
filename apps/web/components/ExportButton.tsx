"use client";
import { blocksToMarkdown } from "@notes/core";
import type { Block } from "@notes/blocks";

interface Props {
  title: string;
  blocks: Block[];
}

export function ExportButton({ title, blocks }: Props) {
  const handleExport = () => {
    const md = `# ${title}\n\n${blocksToMarkdown(blocks)}`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button className="nb-export-btn" onClick={handleExport} title="Export as Markdown">
      ↓ md
    </button>
  );
}
