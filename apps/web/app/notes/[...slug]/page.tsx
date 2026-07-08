import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BlockRenderer, prepareBlocks } from "@notes/renderer-web";
import {
  getNoteBySlug,
  getNotes,
  getTopics,
  notePath,
  topicChain,
} from "../../../lib/data";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { Toc } from "../../../components/Toc";
import { BacklinksPanel } from "../../../components/BacklinksPanel";
import { HoverPreviewProvider } from "../../../components/HoverPreviewProvider";

export const revalidate = 60;

export async function generateStaticParams() {
  const [notes, topics] = await Promise.all([getNotes(), getTopics()]);
  return notes.map((note) => ({ slug: notePath(note, topics) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = await getNoteBySlug(slug[slug.length - 1]);
  if (!note) return {};
  return { title: note.title, description: note.summary ?? undefined };
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const noteSlug = slug[slug.length - 1];
  const [note, topics] = await Promise.all([
    getNoteBySlug(noteSlug),
    getTopics(),
  ]);
  if (!note) notFound();

  const chain = topicChain(note.topicSlug, topics);
  const prepared = await prepareBlocks(note.blocks);
  const updated = note.updatedAt
    ? new Date(note.updatedAt).toLocaleDateString()
    : null;

  return (
    <HoverPreviewProvider>
      <div className="nb-note-layout">
        <article className="nb-article">
          <Breadcrumbs chain={chain} title={note.title} />
          <h1 className="nb-title">{note.title}</h1>
          <p className="nb-meta">
            {note.readingTime > 0 ? `${note.readingTime} min read` : ""}
            {note.readingTime > 0 && updated ? " · " : ""}
            {updated ? `Updated ${updated}` : ""}
          </p>
          <BlockRenderer items={prepared} />
          <BacklinksPanel noteSlug={noteSlug} />
        </article>
        <Toc blocks={note.blocks} />
      </div>
    </HoverPreviewProvider>
  );
}
