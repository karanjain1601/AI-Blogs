import type { Prepared } from "../prepare";
import { BlockRenderer } from "../BlockRenderer";

export function ColumnsBlock({ columns }: { columns: Prepared[][] }) {
  return (
    <div
      className="nb-columns"
      style={{ gridTemplateColumns: `repeat(${columns.length || 1}, minmax(0, 1fr))` }}
    >
      {columns.map((col, i) => (
        <div key={i} className="nb-column">
          <BlockRenderer items={col} />
        </div>
      ))}
    </div>
  );
}
