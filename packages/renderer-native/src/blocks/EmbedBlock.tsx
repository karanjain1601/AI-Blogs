import type { EmbedBlock as EmbedBlockType } from "@notes/blocks";
import { WebViewBlock } from "./WebViewBlock";
import { useTheme } from "../theme";

function getEmbedSrc(block: EmbedBlockType): string {
  const url = block.url;
  if (block.provider === "youtube") {
    const id = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  if (block.provider === "vimeo") {
    const id = url.match(/vimeo\.com\/(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : url;
  }
  return url;
}

export function EmbedBlock({ block }: { block: EmbedBlockType }) {
  const theme = useTheme();
  const src = getEmbedSrc(block);
  const html = `<iframe src="${src}" style="width:100%;height:100%;border:none;background:${theme.code}" frameborder="0" allowfullscreen></iframe>`;
  return <WebViewBlock html={html} minHeight={220} />;
}
