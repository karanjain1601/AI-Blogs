import type { MathBlock as MathBlockType } from "@notes/blocks";
import { WebViewBlock } from "./WebViewBlock";
import { useTheme } from "../theme";

export function MathBlock({ block }: { block: MathBlockType }) {
  const theme = useTheme();
  const escaped = block.content.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const html = `
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<div id="math" style="padding:8px;overflow-x:auto;color:${theme.fg}"></div>
<script>
  try {
    katex.render('${escaped}',document.getElementById('math'),{
      displayMode:${block.display},throwOnError:false
    });
  } catch(e) {
    document.getElementById('math').innerText = '${escaped}';
  }
</script>`;
  return <WebViewBlock html={html} minHeight={block.display ? 80 : 48} />;
}
