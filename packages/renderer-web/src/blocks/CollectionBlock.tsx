import type { CollectionBlock as CollectionBlockType } from "@notes/blocks";

/** Phase 5 implements live collection views; this is a labelled placeholder. */
export function CollectionBlock({ block }: { block: CollectionBlockType }) {
  return (
    <div className="nb-collection">
      <span className="nb-collection-label">Collection · {block.view}</span>
      <span className="nb-collection-note">Live views arrive in a later phase.</span>
    </div>
  );
}
