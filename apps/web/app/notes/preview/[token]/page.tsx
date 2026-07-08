import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BlockRenderer, prepareBlocks } from "@notes/renderer-web";
import { getNoteByToken, getTopics, topicChain } from "../../../../lib/data";
import { Breadcrumbs } from "../../../../components/Breadcrumbs";
import { Toc } from "../../../../components/Toc";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Preview",
};

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [note, topics] = await Promise.all([getNoteByToken(token), getTopics()]);
  if (!note) notFound();

  const chain = topicChain(note.topicSlug, topics);
  const prepared = await prepareBlocks(note.blocks);
  const updated = note.updatedAt
    ? new Date(note.updatedAt).toLocaleDateString()
    : null;

  return (
    <div className="nb-note-layout">
      <article className="nb-article">
        <div className="nb-preview-banner">
          Draft preview — not yet published
        </div>
        <Breadcrumbs chain={chain} title={note.title} />
        <h1 className="nb-title">{note.title}</h1>
        <p className="nb-meta">
          {note.readingTime > 0 ? `${note.readingTime} min read` : ""}
          {note.readingTime > 0 && updated ? " · " : ""}
          {updated ? `Updated ${updated}` : ""}
        </p>
        <BlockRenderer items={prepared} />
      </article>
      <Toc blocks={note.blocks} />
    </div>
  );
}
