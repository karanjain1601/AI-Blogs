import type { JSX } from "react";
import type { HeadingBlock as HeadingBlockType } from "@notes/blocks";
import { slugify } from "@notes/core";

export function HeadingBlock({ block }: { block: HeadingBlockType }) {
  const id = block.id ?? slugify(block.content);
  const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;
  return (
    <Tag id={id} className="nb-heading">
      <a href={`#${id}`} className="nb-anchor" aria-hidden="true" tabIndex={-1}>
        #
      </a>
      {block.content}
    </Tag>
  );
}
