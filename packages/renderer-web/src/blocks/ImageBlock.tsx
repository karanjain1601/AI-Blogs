import type { ImageBlock as ImageBlockType } from "@notes/blocks";

export function ImageBlock({ block }: { block: ImageBlockType }) {
  return (
    <figure className="nb-figure">
      {/* Plain img keeps this component framework-agnostic; the app can wrap with next/image later. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={block.src} alt={block.alt} loading="lazy" />
      {block.caption ? <figcaption>{block.caption}</figcaption> : null}
    </figure>
  );
}
