import type { ListBlock as ListBlockType } from "@notes/blocks";

export function ListBlock({ block }: { block: ListBlockType }) {
  const items = block.items.map((item, i) => <li key={i}>{item}</li>);
  return block.ordered ? (
    <ol className="nb-list">{items}</ol>
  ) : (
    <ul className="nb-list">{items}</ul>
  );
}
