import { View } from "react-native";
import type { Block } from "@notes/blocks";
import { TextBlock } from "./blocks/TextBlock";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { CodeBlock } from "./blocks/CodeBlock";
import { MermaidBlock } from "./blocks/MermaidBlock";
import { MathBlock } from "./blocks/MathBlock";
import { ImageBlock } from "./blocks/ImageBlock";
import { CalloutBlock } from "./blocks/CalloutBlock";
import { QuoteBlock } from "./blocks/QuoteBlock";
import { ListBlock } from "./blocks/ListBlock";
import { TodoBlock } from "./blocks/TodoBlock";
import { TableBlock } from "./blocks/TableBlock";
import { DividerBlock } from "./blocks/DividerBlock";
import { VideoBlock } from "./blocks/VideoBlock";
import { GalleryBlock } from "./blocks/GalleryBlock";
import { FileBlock } from "./blocks/FileBlock";
import { EmbedBlock } from "./blocks/EmbedBlock";
import { ColumnsBlock } from "./blocks/ColumnsBlock";
import { TabsBlock } from "./blocks/TabsBlock";
import { DetailsBlock } from "./blocks/DetailsBlock";

function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "text": return <TextBlock block={block} />;
    case "heading": return <HeadingBlock block={block} />;
    case "code": return <CodeBlock block={block} />;
    case "mermaid": return <MermaidBlock block={block} />;
    case "math": return <MathBlock block={block} />;
    case "image": return <ImageBlock block={block} />;
    case "callout": return <CalloutBlock block={block} />;
    case "quote": return <QuoteBlock block={block} />;
    case "list": return <ListBlock block={block} />;
    case "todo": return <TodoBlock block={block} />;
    case "table": return <TableBlock block={block} />;
    case "divider": return <DividerBlock />;
    case "video": return <VideoBlock block={block} />;
    case "gallery": return <GalleryBlock block={block} />;
    case "file": return <FileBlock block={block} />;
    case "embed": return <EmbedBlock block={block} />;
    case "columns": return <ColumnsBlock block={block} />;
    case "tabs": return <TabsBlock block={block} />;
    case "details": return <DetailsBlock block={block} />;
    default: return null;
  }
}

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <View key={block.id ?? i}>
          <RenderBlock block={block} />
        </View>
      ))}
    </>
  );
}
