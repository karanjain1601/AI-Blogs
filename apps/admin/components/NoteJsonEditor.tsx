"use client";
import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import type { Block } from "@notes/blocks";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-[#8b919a] text-sm">
      Loading editor…
    </div>
  ),
});

const BLOCK_TEMPLATES: { label: string; template: object }[] = [
  { label: "Text", template: { type: "text", content: "" } },
  { label: "Heading", template: { type: "heading", level: 2, content: "" } },
  { label: "Code", template: { type: "code", language: "typescript", content: "" } },
  { label: "Mermaid", template: { type: "mermaid", content: "graph TD\n  A --> B", layout: "tabs" } },
  { label: "Math", template: { type: "math", content: "E = mc^2", display: true } },
  { label: "Callout", template: { type: "callout", variant: "info", title: "", content: "" } },
  { label: "Image", template: { type: "image", src: "", alt: "" } },
  { label: "List", template: { type: "list", ordered: false, items: ["Item 1"] } },
  { label: "Todo", template: { type: "todo", items: [{ text: "Task", checked: false }] } },
  { label: "Table", template: { type: "table", headers: ["A", "B"], rows: [["a1", "b1"]] } },
  { label: "Divider", template: { type: "divider" } },
  { label: "Columns", template: { type: "columns", columns: [{ blocks: [] }, { blocks: [] }] } },
  { label: "Tabs", template: { type: "tabs", tabs: [{ label: "Tab 1", blocks: [] }] } },
  { label: "Details", template: { type: "details", summary: "More", blocks: [] } },
  { label: "Quote", template: { type: "quote", content: "", cite: "" } },
];

interface Props {
  initialBlocks: Block[];
  onSave: (blocks: Block[]) => void | Promise<void>;
  saving?: boolean;
}

export function NoteJsonEditor({ initialBlocks, onSave, saving }: Props) {
  const [value, setValue] = useState(() =>
    JSON.stringify(initialBlocks, null, 2),
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleChange = useCallback((v: string | undefined) => {
    const text = v ?? "[]";
    setValue(text);
    try {
      JSON.parse(text);
      setParseError(null);
    } catch (e) {
      setParseError((e as Error).message);
    }
  }, []);

  const insertBlock = useCallback(
    (template: object) => {
      try {
        const blocks = JSON.parse(value);
        if (!Array.isArray(blocks)) return;
        blocks.push(template);
        setValue(JSON.stringify(blocks, null, 2));
        setParseError(null);
      } catch {
        // ignore if current JSON is invalid
      }
    },
    [value],
  );

  const handleSave = useCallback(async () => {
    setSaveError(null);
    try {
      const blocks = JSON.parse(value);
      await onSave(blocks);
    } catch (e) {
      setSaveError((e as Error).message);
    }
  }, [value, onSave]);

  return (
    <div className="flex flex-col h-full">
      {/* Block toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-[#2a2e35] bg-[#131619]">
        {BLOCK_TEMPLATES.map((bt) => (
          <button
            key={bt.label}
            type="button"
            onClick={() => insertBlock(bt.template)}
            className="px-2 py-1 text-xs bg-[#1a1d22] hover:bg-[#2a2e35] text-[#c9cdd4] rounded transition-colors"
          >
            + {bt.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language="json"
          theme="vs-dark"
          value={value}
          onChange={handleChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-[#2a2e35] bg-[#131619]">
        {parseError && (
          <span className="text-xs text-red-400 flex-1 truncate">
            JSON error: {parseError}
          </span>
        )}
        {saveError && (
          <span className="text-xs text-red-400 flex-1 truncate">
            {saveError}
          </span>
        )}
        {!parseError && !saveError && (
          <span className="text-xs text-[#8b919a] flex-1">
            {Array.isArray(JSON.parse(value || "[]"))
              ? `${JSON.parse(value || "[]").length} blocks`
              : ""}
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!!parseError || saving}
          className="px-4 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {saving ? "Saving…" : "Save blocks"}
        </button>
      </div>
    </div>
  );
}
