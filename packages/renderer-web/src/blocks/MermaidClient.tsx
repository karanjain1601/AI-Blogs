"use client";

import { useEffect, useRef, useState } from "react";
import { CopyButton } from "../CopyButton";

type Layout = "tabs" | "stacked" | "split";

export function MermaidClient({
  content,
  sourceHtml,
  title,
  layout = "tabs",
  defaultTab = "diagram",
}: {
  content: string;
  sourceHtml: string;
  title?: string;
  layout?: Layout;
  defaultTab?: "diagram" | "source";
}) {
  const [tab, setTab] = useState<"diagram" | "source">(defaultTab);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const idRef = useRef(`nb-mmd-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        const isDark = document.documentElement.classList.contains("dark");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: isDark ? "dark" : "default",
        });
        const { svg } = await mermaid.render(idRef.current, content);
        if (!cancelled) {
          setSvg(svg);
          setError("");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to render diagram");
        }
      }
    }

    void render();
    const onThemeChange = () => void render();
    window.addEventListener("themechange", onThemeChange);
    return () => {
      cancelled = true;
      window.removeEventListener("themechange", onThemeChange);
    };
  }, [content]);

  const diagram = error ? (
    // Fail-safe: never lose the content — the source is always available too.
    <div className="nb-mermaid-error">Diagram error: {error}</div>
  ) : svg ? (
    <div className="nb-mermaid-diagram" dangerouslySetInnerHTML={{ __html: svg }} />
  ) : (
    <div className="nb-mermaid-loading">Rendering diagram…</div>
  );

  const source = (
    <div className="nb-mermaid-source">
      <div className="nb-code-head">
        <span className="nb-code-lang">mermaid</span>
        <CopyButton text={content} />
      </div>
      <div className="nb-code-body" dangerouslySetInnerHTML={{ __html: sourceHtml }} />
    </div>
  );

  const caption = title ? <figcaption>{title}</figcaption> : null;

  if (layout === "stacked") {
    return (
      <figure className="nb-mermaid">
        {diagram}
        {source}
        {caption}
      </figure>
    );
  }

  if (layout === "split") {
    return (
      <figure className="nb-mermaid nb-mermaid-split">
        <div className="nb-mermaid-splitgrid">
          {diagram}
          {source}
        </div>
        {caption}
      </figure>
    );
  }

  // tabs (default)
  return (
    <figure className="nb-mermaid">
      <div className="nb-tablist" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "diagram"}
          className={tab === "diagram" ? "active" : undefined}
          onClick={() => setTab("diagram")}
        >
          Diagram
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "source"}
          className={tab === "source" ? "active" : undefined}
          onClick={() => setTab("source")}
        >
          Source
        </button>
      </div>
      <div className="nb-tabpanel">{tab === "diagram" ? diagram : source}</div>
      {caption}
    </figure>
  );
}
