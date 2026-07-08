import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  childTopics,
  getNotes,
  getTopics,
  notePathHref,
  notesInTopic,
  topicChain,
} from "../../../lib/data";
import { Breadcrumbs } from "../../../components/Breadcrumbs";

export const revalidate = 60;

export async function generateStaticParams() {
  const topics = await getTopics();
  return topics.map((topic) => ({ topic: topic.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  const topics = await getTopics();
  const current = topics.find((t) => t.slug === topic);
  return current
    ? { title: current.name, description: current.description ?? undefined }
    : {};
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const [topics, notes] = await Promise.all([getTopics(), getNotes()]);
  const current = topics.find((t) => t.slug === topic);
  if (!current) notFound();

  const chain = topicChain(current.slug, topics);
  const subtopics = childTopics(current.slug, topics);
  const topicNotes = notesInTopic(current.slug, notes);

  return (
    <div className="nb-topic-page">
      <Breadcrumbs chain={chain} />
      <h1>
        {current.icon ? `${current.icon} ` : ""}
        {current.name}
      </h1>
      {current.description ? <p className="nb-lede">{current.description}</p> : null}

      {subtopics.length ? (
        <section>
          <h2>Subtopics</h2>
          <div className="nb-card-grid">
            {subtopics.map((sub) => (
              <Link key={sub.slug} href={`/topics/${sub.slug}`} className="nb-card">
                <span className="nb-card-title">{sub.name}</span>
                {sub.description ? (
                  <span className="nb-card-desc">{sub.description}</span>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2>Notes</h2>
        {topicNotes.length ? (
          <ul className="nb-note-list">
            {topicNotes.map((note) => (
              <li key={note.slug}>
                <Link href={notePathHref(note, topics)}>{note.title}</Link>
                {note.summary ? (
                  <span className="nb-note-summary">{note.summary}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No notes yet.</p>
        )}
      </section>
    </div>
  );
}
