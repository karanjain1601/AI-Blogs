import type { CalloutBlock as CalloutBlockType } from "@notes/blocks";

export function CalloutBlock({
  block,
  html,
}: {
  block: CalloutBlockType;
  html: string;
}) {
  return (
    <div className={`nb-callout nb-callout-${block.variant}`}>
      {block.title ? <p className="nb-callout-title">{block.title}</p> : null}
      <div className="nb-prose" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
