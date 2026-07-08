import type { Prepared } from "./prepare";
import { BlockErrorBoundary } from "./ErrorBoundary";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { CodeBlock } from "./blocks/CodeBlock";
import { CalloutBlock } from "./blocks/CalloutBlock";
import { QuoteBlock } from "./blocks/QuoteBlock";
import { ListBlock } from "./blocks/ListBlock";
import { TodoBlock } from "./blocks/TodoBlock";
import { TableBlock } from "./blocks/TableBlock";
import { ImageBlock } from "./blocks/ImageBlock";
import { VideoBlock } from "./blocks/VideoBlock";
import { GalleryBlock } from "./blocks/GalleryBlock";
import { FileBlock } from "./blocks/FileBlock";
import { EmbedBlock } from "./blocks/EmbedBlock";
import { EmbedNoteBlock } from "./blocks/EmbedNoteBlock";
import { CollectionBlock } from "./blocks/CollectionBlock";
import { ColumnsBlock } from "./blocks/ColumnsBlock";
import { DetailsBlock } from "./blocks/DetailsBlock";
import { TabsClient } from "./blocks/TabsClient";
import { MermaidClient } from "./blocks/MermaidClient";

function RenderPrepared({ item }: { item: Prepared }) {
  const { block } = item;
  switch (block.type) {
    case "text":
      return (
        <div className="nb-prose" dangerouslySetInnerHTML={{ __html: item.html ?? "" }} />
      );
    case "heading":
      return <HeadingBlock block={block} />;
    case "code":
      return <CodeBlock block={block} html={item.html ?? ""} />;
    case "mermaid":
      return (
        <MermaidClient
          content={block.content}
          sourceHtml={item.sourceHtml ?? ""}
          title={block.title}
          layout={block.layout}
          defaultTab={block.defaultTab}
        />
      );
    case "math":
      return (
        <div
          className={block.display ? "nb-math nb-math-block" : "nb-math"}
          dangerouslySetInnerHTML={{ __html: item.html ?? "" }}
        />
      );
    case "callout":
      return <CalloutBlock block={block} html={item.html ?? ""} />;
    case "quote":
      return <QuoteBlock block={block} html={item.html ?? ""} />;
    case "list":
      return <ListBlock block={block} />;
    case "todo":
      return <TodoBlock block={block} />;
    case "table":
      return <TableBlock block={block} />;
    case "divider":
      return <hr className="nb-divider" />;
    case "image":
      return <ImageBlock block={block} />;
    case "video":
      return <VideoBlock block={block} />;
    case "gallery":
      return <GalleryBlock block={block} />;
    case "file":
      return <FileBlock block={block} />;
    case "embed":
      return <EmbedBlock block={block} />;
    case "embed-note":
      return <EmbedNoteBlock block={block} />;
    case "collection":
      return <CollectionBlock block={block} />;
    case "columns":
      return <ColumnsBlock columns={item.columns ?? []} />;
    case "details":
      return <DetailsBlock summary={block.summary} items={item.children ?? []} />;
    case "tabs":
      return (
        <TabsClient
          tabs={(item.tabs ?? []).map((t) => ({
            label: t.label,
            content: <BlockRenderer items={t.children} />,
          }))}
        />
      );
    case "toc":
      // Rendered as a page-level aside, not inline.
      return null;
    default:
      return null;
  }
}

export function BlockRenderer({ items }: { items: Prepared[] }) {
  return (
    <>
      {items.map((item, i) => (
        <BlockErrorBoundary key={i}>
          <RenderPrepared item={item} />
        </BlockErrorBoundary>
      ))}
    </>
  );
}
