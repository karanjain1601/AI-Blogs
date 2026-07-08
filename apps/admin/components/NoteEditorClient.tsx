"use client";
import { useState, useTransition } from "react";
import { NoteJsonEditor } from "./NoteJsonEditor";
import type { Block } from "@notes/blocks";

interface Props {
  noteId: string;
  initialBlocks: Block[];
  saveBlocksAction: (noteId: string, blocksJson: string) => Promise<{ error?: string }>;
}

export function NoteEditorClient({ noteId, initialBlocks, saveBlocksAction }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string } | null>(null);

  const handleSave = (blocks: Block[]): void => {
    setResult(null);
    startTransition(async () => {
      const res = await saveBlocksAction(noteId, JSON.stringify(blocks));
      setResult(res);
    });
  };

  return (
    <div className="flex flex-col h-full">
      {result?.error && (
        <div className="px-4 py-2 bg-red-950/40 border-b border-red-900/50 text-red-400 text-sm">
          {result.error}
        </div>
      )}
      {result && !result.error && (
        <div className="px-4 py-2 bg-green-950/40 border-b border-green-900/50 text-green-400 text-sm">
          Blocks saved.
        </div>
      )}
      <div className="flex-1 min-h-0">
        <NoteJsonEditor
          initialBlocks={initialBlocks}
          onSave={handleSave}
          saving={isPending}
        />
      </div>
    </div>
  );
}
