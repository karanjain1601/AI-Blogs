import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAuthor, getAuthorNotes, getTopics, notePathHref } from "../../../lib/data";
import { AuthorBadge } from "../../../components/AuthorBadge";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) return {};
  return { title: author.name, description: author.bio ?? undefined };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [author, topics] = await Promise.all([getAuthor(slug), getTopics()]);
  if (!author) notFound();

  const notes = await getAuthorNotes(author.id);

  return (
    <div className="nb-author-page">
      <div className="nb-author-profile">
        <AuthorBadge author={author} />
        {author.bio && <p className="nb-author-bio">{author.bio}</p>}
        <div className="nb-author-links">
          {author.websiteUrl && (
            <a href={author.websiteUrl} target="_blank" rel="noopener noreferrer" className="nb-author-link">
              Website ↗
            </a>
          )}
          {author.githubHandle && (
            <a href={`https://github.com/${author.githubHandle}`} target="_blank" rel="noopener noreferrer" className="nb-author-link">
              GitHub ↗
            </a>
          )}
          {author.twitterHandle && (
            <a href={`https://twitter.com/${author.twitterHandle}`} target="_blank" rel="noopener noreferrer" className="nb-author-link">
              Twitter ↗
            </a>
          )}
        </div>
      </div>

      {notes.length > 0 && (
        <section className="nb-author-notes">
          <h2 className="nb-section-heading">Notes by {author.name}</h2>
          <ul className="nb-note-list">
            {notes.map((note) => (
              <li key={note.slug}>
                <Link href={notePathHref(note, topics)} className="nb-note-link">
                  <span className="nb-note-link-title">{note.title}</span>
                  {note.summary && (
                    <span className="nb-note-link-summary">{note.summary}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
