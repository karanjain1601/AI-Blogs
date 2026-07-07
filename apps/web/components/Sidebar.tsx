import Link from "next/link";
import type { NoteView, TopicView } from "../lib/types";
import { childTopics, notePathHref, notesInTopic } from "../lib/data";

export function Sidebar({
  topics,
  notes,
}: {
  topics: TopicView[];
  notes: NoteView[];
}) {
  const roots = childTopics(null, topics);
  return (
    <nav className="nb-sidebar" aria-label="Topics">
      <Link href="/" className="nb-brand">
        Engineering Notes
      </Link>
      <ul className="nb-tree">
        {roots.map((topic) => (
          <TopicNode key={topic.slug} topic={topic} topics={topics} notes={notes} />
        ))}
      </ul>
    </nav>
  );
}

function TopicNode({
  topic,
  topics,
  notes,
}: {
  topic: TopicView;
  topics: TopicView[];
  notes: NoteView[];
}) {
  const kids = childTopics(topic.slug, topics);
  const topicNotes = notesInTopic(topic.slug, notes);
  return (
    <li className="nb-tree-topic">
      <Link href={`/topics/${topic.slug}`} className="nb-tree-topic-link">
        {topic.icon ? <span className="nb-tree-icon">{topic.icon}</span> : null}
        {topic.name}
      </Link>
      {kids.length || topicNotes.length ? (
        <ul>
          {kids.map((kid) => (
            <TopicNode key={kid.slug} topic={kid} topics={topics} notes={notes} />
          ))}
          {topicNotes.map((note) => (
            <li key={note.slug} className="nb-tree-note">
              <Link href={notePathHref(note, topics)}>{note.title}</Link>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
