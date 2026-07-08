import type { EmbedNoteBlock as EmbedNoteBlockType } from "@notes/blocks";

/**
 * Phase 1 renders transclusion as a link to the target. Full inline embedding
 * (`![[note#heading]]`) arrives in Phase 3 with the linking layer.
 */
export function EmbedNoteBlock({ block }: { block: EmbedNoteBlockType }) {
  const anchor = block.anchor ? block.anchor.replace("^", "#") : "";
  return (
    <div className="nb-embed-note">
      <span className="nb-embed-note-label">Embedded note</span>
      <a href={`/notes/${block.target}${anchor}`}>
        {block.target}
        {block.anchor ?? ""}
      </a>
    </div>
  );
}
