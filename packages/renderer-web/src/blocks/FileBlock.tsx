import type { FileBlock as FileBlockType } from "@notes/blocks";

export function FileBlock({ block }: { block: FileBlockType }) {
  return (
    <a className="nb-file" href={block.src} download>
      <span className="nb-file-name">{block.name}</span>
      {block.size ? <span className="nb-file-size">{block.size}</span> : null}
    </a>
  );
}
