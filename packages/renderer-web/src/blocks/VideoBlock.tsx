import type { VideoBlock as VideoBlockType } from "@notes/blocks";

export function VideoBlock({ block }: { block: VideoBlockType }) {
  return (
    <figure className="nb-figure">
      <video src={block.src} poster={block.poster} controls preload="metadata" />
      {block.caption ? <figcaption>{block.caption}</figcaption> : null}
    </figure>
  );
}
