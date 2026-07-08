import Link from "next/link";
import type { CollectionBlock as CollectionBlockType } from "@notes/blocks";

export function CollectionBlock({ block }: { block: CollectionBlockType }) {
  const filter = block.filter;
  const tag = typeof filter === "object" && filter !== null && "tag" in filter
    ? (filter as { tag: string }).tag
    : null;
  const href = tag ? `/search?q=${encodeURIComponent(tag)}` : "/search";
  const label = tag ? `All notes tagged "${tag}"` : "Browse all notes";

  return (
    <div className="nb-collection">
      <div className="nb-collection-header">
        <span className="nb-collection-view">{block.view}</span>
        {tag && <span className="nb-collection-filter">#{tag}</span>}
      </div>
      <Link href={href} className="nb-collection-link">
        {label} →
      </Link>
    </div>
  );
}
