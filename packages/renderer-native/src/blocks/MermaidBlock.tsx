import type { MermaidBlock as MermaidBlockType } from "@notes/blocks";
import { WebViewBlock } from "./WebViewBlock";
import { useTheme } from "../theme";

export function MermaidBlock({ block }: { block: MermaidBlockType }) {
  const theme = useTheme();
  const isDark = theme.bg === "#0b0d10";
  const html = `
<div id="diagram"></div>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({startOnLoad:false,theme:'${isDark ? "dark" : "default"}'});
  mermaid.render('m','${block.content.replace(/'/g, "\\'").replace(/\n/g, "\\n")}').then(r=>{
    document.getElementById('diagram').innerHTML=r.svg;
  }).catch(e=>{
    document.getElementById('diagram').innerText='Diagram error: '+e.message;
  });
</script>
${block.title ? `<p style="color:${theme.muted};font-size:12px;margin-top:8px">${block.title}</p>` : ""}`;
  return <WebViewBlock html={html} minHeight={180} />;
}
