import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";

// `:::note` / `:::warning` … container (and leaf) directives → styled callouts.
const CALLOUT_NAMES: Record<string, string> = {
  note: "note",
  info: "info",
  tip: "tip",
  warning: "warning",
  caution: "warning",
  error: "error",
  danger: "error",
};

function remarkCallouts() {
  return (tree: unknown): void => {
    visit(tree as never, (node: unknown) => {
      const n = node as {
        type?: string;
        name?: string;
        data?: { hName?: string; hProperties?: Record<string, unknown> };
      };
      if (n.type === "containerDirective" || n.type === "leafDirective") {
        const variant = n.name ? CALLOUT_NAMES[n.name] : undefined;
        if (!variant) return;
        const data = n.data ?? (n.data = {});
        data.hName = "div";
        data.hProperties = { className: ["nb-callout", `nb-callout-${variant}`] };
      }
    });
  };
}

// Allow the class names our directives/footnotes emit through the sanitizer.
// Also allow data-slug on anchors for hover previews.
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className", "id"],
    a: [...(defaultSchema.attributes?.["a"] ?? []), "href", "data-slug"],
  },
  tagNames: [...(defaultSchema.tagNames ?? []), "section", "div", "span"],
};

// Adds data-slug to anchors pointing at /notes/... for hover previews
function rehypeAddSlugAttr() {
  return (tree: unknown): void => {
    visit(tree as never, "element", (node: unknown) => {
      const n = node as {
        tagName?: string;
        properties?: Record<string, unknown>;
      };
      if (n.tagName !== "a" || !n.properties) return;
      const href = n.properties.href as string | undefined;
      if (!href?.startsWith("/notes/")) return;
      const parts = href.split("/").filter(Boolean);
      const noteSlug = parts[parts.length - 1];
      if (noteSlug) n.properties["data-slug"] = noteSlug;
    });
  };
}

// Convert `[[slug|Display]]` wiki-links to normal markdown links. Block-level
// transclusion (`![[...]]`) is handled separately by the embed-note block.
function preprocessWikiLinks(md: string): string {
  return md.replace(/(!?)\[\[([^\]]+)\]\]/g, (_match, bang: string, body: string) => {
    if (bang === "!") return "";
    let target = body.trim();
    let display = target;
    const pipe = target.indexOf("|");
    if (pipe !== -1) {
      display = target.slice(pipe + 1).trim();
      target = target.slice(0, pipe).trim();
    }
    let anchor = "";
    const anchorIdx = target.search(/[#^]/);
    if (anchorIdx !== -1) {
      anchor = target.slice(anchorIdx).replace("^", "#");
      target = target.slice(0, anchorIdx).trim();
    }
    const safe = target.replace(/[)\s]/g, "-");
    return `[${display}](/notes/${safe}${anchor})`;
  });
}

/** Render a markdown string to sanitized HTML (GFM + footnotes + directives). */
export async function renderMarkdown(md: string): Promise<string> {
  const preprocessed = preprocessWikiLinks(md);
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkCallouts)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize, schema)
    .use(rehypeAddSlugAttr)
    .use(rehypeStringify)
    .process(preprocessed);
  return String(result);
}
