import Link from "next/link";
import { childTopics, getNotes, getTopics, notePathHref } from "../lib/data";

export default async function Home() {
  const [topics, notes] = await Promise.all([getTopics(), getNotes()]);
  const roots = childTopics(null, topics);
  const recent = notes.slice(0, 5);

  return (
    <div className="nb-home">
      <h1>Engineering Notes</h1>
      <p className="nb-lede">
        A config-driven knowledge base. Browse by topic or jump into a recent note.
      </p>

      <section>
        <h2>Topics</h2>
        <div className="nb-card-grid">
          {roots.map((topic) => (
            <Link key={topic.slug} href={`/topics/${topic.slug}`} className="nb-card">
              <span className="nb-card-title">
                {topic.icon ? `${topic.icon} ` : ""}
                {topic.name}
              </span>
              {topic.description ? (
                <span className="nb-card-desc">{topic.description}</span>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2>Recently updated</h2>
        <ul className="nb-note-list">
          {recent.map((note) => (
            <li key={note.slug}>
              <Link href={notePathHref(note, topics)}>{note.title}</Link>
              {note.summary ? (
                <span className="nb-note-summary">{note.summary}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
