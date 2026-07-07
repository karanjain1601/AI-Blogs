import type { CodeBlock as CodeBlockType } from "@notes/blocks";
import { CopyButton } from "../CopyButton";

export function CodeBlock({
  block,
  html,
}: {
  block: CodeBlockType;
  html: string;
}) {
  return (
    <figure className="nb-code">
      <figcaption className="nb-code-head">
        <span className="nb-code-lang">{block.filename ?? block.language}</span>
        <CopyButton text={block.content} />
      </figcaption>
      <div className="nb-code-body" dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  );
}
