import Link from "next/link";
import { getBacklinks, getOutgoingLinks } from "../lib/data";
import type { NoteLink } from "../lib/data";

function LinkCard({ note }: { note: NoteLink }) {
  return (
    <Link href={`/notes/${note.slug}`} className="nb-link-card">
      <span className="nb-link-card-title">{note.title}</span>
      {note.summary && (
        <span className="nb-link-card-summary">{note.summary}</span>
      )}
    </Link>
  );
}

export async function BacklinksPanel({ noteSlug }: { noteSlug: string }) {
  const [backlinks, outgoing] = await Promise.all([
    getBacklinks(noteSlug),
    getOutgoingLinks(noteSlug),
  ]);

  if (!backlinks.length && !outgoing.length) return null;

  return (
    <section className="nb-links-panel">
      {backlinks.length > 0 && (
        <div className="nb-links-section">
          <h2 className="nb-links-heading">Referenced by</h2>
          <div className="nb-links-grid">
            {backlinks.map((note) => (
              <LinkCard key={note.slug} note={note} />
            ))}
          </div>
        </div>
      )}
      {outgoing.length > 0 && (
        <div className="nb-links-section">
          <h2 className="nb-links-heading">Links to</h2>
          <div className="nb-links-grid">
            {outgoing.map((note) => (
              <LinkCard key={note.slug} note={note} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
