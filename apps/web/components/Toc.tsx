import { buildToc } from "@notes/core";
import type { Block } from "@notes/blocks";

export function Toc({ blocks }: { blocks: Block[] }) {
  const entries = buildToc(blocks);
  if (entries.length < 2) return null;
  return (
    <aside className="nb-toc" aria-label="On this page">
      <p className="nb-toc-title">On this page</p>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id} className={`nb-toc-l${entry.level}`}>
            <a href={`#${entry.id}`}>{entry.text}</a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
