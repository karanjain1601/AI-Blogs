import type { EmbedBlock as EmbedBlockType } from "@notes/blocks";

function youtubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|[?&]v=|embed\/)([\w-]{11})/);
  return match ? match[1] : null;
}

export function EmbedBlock({ block }: { block: EmbedBlockType }) {
  if (block.provider === "youtube") {
    const id = youtubeId(block.url);
    if (id) {
      return (
        <div className="nb-embed nb-embed-video">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title="Embedded video"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      );
    }
  }
  return (
    <a className="nb-embed-link" href={block.url} target="_blank" rel="noreferrer">
      {block.url}
    </a>
  );
}
