import type { QuoteBlock as QuoteBlockType } from "@notes/blocks";

export function QuoteBlock({
  block,
  html,
}: {
  block: QuoteBlockType;
  html: string;
}) {
  return (
    <blockquote className="nb-quote">
      <div className="nb-prose" dangerouslySetInnerHTML={{ __html: html }} />
      {block.cite ? <cite className="nb-cite">— {block.cite}</cite> : null}
    </blockquote>
  );
}
