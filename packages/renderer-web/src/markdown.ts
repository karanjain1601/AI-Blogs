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
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className", "id"],
  },
  tagNames: [...(defaultSchema.tagNames ?? []), "section", "div", "span"],
};

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

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDirective)
  .use(remarkCallouts)
  .use(remarkRehype)
  .use(rehypeSanitize, schema)
  .use(rehypeStringify);

/** Render a markdown string to sanitized HTML (GFM + footnotes + directives). */
export async function renderMarkdown(md: string): Promise<string> {
  const file = await processor.process(preprocessWikiLinks(md));
  return String(file);
}
