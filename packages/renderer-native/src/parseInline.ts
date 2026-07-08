export interface Span {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  href?: string;
}

// Parses inline markdown: **bold**, *italic*, `code`, [[wikilinks]], [text](url)
export function parseInline(md: string): Span[] {
  const spans: Span[] = [];
  // Regex: bold, italic, code, markdown link, wikilink
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    if (m.index > last) spans.push({ text: md.slice(last, m.index) });
    if (m[1] !== undefined) spans.push({ text: m[1], bold: true });
    else if (m[2] !== undefined) spans.push({ text: m[2], italic: true });
    else if (m[3] !== undefined) spans.push({ text: m[3], code: true });
    else if (m[4] !== undefined) spans.push({ text: m[4], href: m[5] });
    else if (m[6] !== undefined) {
      const display = m[7] ?? m[6];
      const slug = m[6].split("/").pop() ?? m[6];
      spans.push({ text: display, href: `/notes/${slug}` });
    }
    last = m.index + m[0].length;
  }
  if (last < md.length) spans.push({ text: md.slice(last) });
  return spans;
}
