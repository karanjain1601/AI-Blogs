import type { VideoBlock as VideoBlockType } from "@notes/blocks";
import { WebViewBlock } from "./WebViewBlock";
import { useTheme } from "../theme";

export function VideoBlock({ block }: { block: VideoBlockType }) {
  const theme = useTheme();
  const html = `
<video controls poster="${block.poster ?? ""}"
  style="width:100%;max-height:280px;background:${theme.code}">
  <source src="${block.src}" />
</video>
${block.caption ? `<p style="color:${theme.muted};font-size:12px;text-align:center;margin-top:4px">${block.caption}</p>` : ""}`;
  return <WebViewBlock html={html} minHeight={200} />;
}
