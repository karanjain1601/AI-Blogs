import type { Prepared } from "../prepare";
import { BlockRenderer } from "../BlockRenderer";

export function DetailsBlock({
  summary,
  items,
}: {
  summary: string;
  items: Prepared[];
}) {
  return (
    <details className="nb-details">
      <summary>{summary}</summary>
      <div className="nb-details-body">
        <BlockRenderer items={items} />
      </div>
    </details>
  );
}
