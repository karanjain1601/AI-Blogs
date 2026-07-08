import Link from "next/link";
import { searchNotes } from "../../lib/data";

export const metadata = {
  title: "Search",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q.trim() ? await searchNotes(q.trim()) : [];

  return (
    <div className="nb-search-page">
      <h1 className="nb-search-heading">Search</h1>
      <form method="get" action="/search" className="nb-search-form">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search notes…"
          className="nb-search-input"
          autoFocus
        />
        <button type="submit" className="nb-search-submit">
          Search
        </button>
      </form>
      {q.trim() && (
        <p className="nb-search-count">
          {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;
          {q}&rdquo;
        </p>
      )}
      {results.length > 0 && (
        <ul className="nb-search-results">
          {results.map((note) => (
            <li key={note.slug}>
              <Link href={`/notes/${note.slug}`} className="nb-search-result">
                <span className="nb-search-result-title">{note.title}</span>
                {note.summary && (
                  <span className="nb-search-result-summary">
                    {note.summary}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
