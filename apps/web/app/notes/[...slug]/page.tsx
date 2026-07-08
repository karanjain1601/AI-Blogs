import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BlockRenderer, prepareBlocks } from "@notes/renderer-web";
import {
  getNoteBySlug,
  getNotes,
  getTopics,
  getReactions,
  notePath,
  topicChain,
  notePathHref,
} from "../../../lib/data";
import { Breadcrumbs } from "../../../components/Breadcrumbs";
import { Toc } from "../../../components/Toc";
import { BacklinksPanel } from "../../../components/BacklinksPanel";
import { HoverPreviewProvider } from "../../../components/HoverPreviewProvider";
import { Reactions } from "../../../components/Reactions";
import { GiscusComments } from "../../../components/GiscusComments";
import { ExportButton } from "../../../components/ExportButton";
import { ViewCounter } from "../../../components/ViewCounter";
import { AuthorBadge } from "../../../components/AuthorBadge";

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

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const ogUrl = `${base}/og?title=${encodeURIComponent(note.title)}${note.summary ? `&summary=${encodeURIComponent(note.summary)}` : ""}`;

  return {
    title: note.title,
    description: note.summary ?? undefined,
    openGraph: {
      title: note.title,
      description: note.summary ?? undefined,
      type: "article",
      modifiedTime: note.updatedAt ?? undefined,
      tags: note.tags,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: note.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: note.title,
      description: note.summary ?? undefined,
      images: [ogUrl],
    },
  };
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
  const reactions = note.id ? await getReactions(note.id) : [];
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${notePathHref(note, topics)}`;
  const updated = note.updatedAt
    ? new Date(note.updatedAt).toLocaleDateString()
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: note.title,
    description: note.summary ?? undefined,
    dateModified: note.updatedAt ?? undefined,
    url: canonicalUrl,
    keywords: note.tags.join(", "),
    author: { "@type": "Person", name: "Engineering Notes" },
  };

  return (
    <HoverPreviewProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {note.id && <ViewCounter noteId={note.id} />}
      <div className="nb-note-layout">
        <article className="nb-article">
          <Breadcrumbs chain={chain} title={note.title} />
          <div className="nb-title-row">
            <h1 className="nb-title">{note.title}</h1>
            <ExportButton title={note.title} blocks={note.blocks} />
          </div>
          <p className="nb-meta">
            {note.readingTime > 0 ? `${note.readingTime} min read` : ""}
            {note.readingTime > 0 && updated ? " · " : ""}
            {updated ? `Updated ${updated}` : ""}
          </p>
          {note.author != null && <AuthorBadge author={note.author} />}
          <BlockRenderer items={prepared} />
          <BacklinksPanel noteSlug={noteSlug} />
          {note.id && <Reactions noteId={note.id} />}
          <GiscusComments slug={noteSlug} />
        </article>
        <Toc blocks={note.blocks} />
      </div>
    </HoverPreviewProvider>
  );
}
