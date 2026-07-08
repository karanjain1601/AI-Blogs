import Link from "next/link";
import type { Author } from "../lib/types";

export function AuthorBadge({ author }: { author: Author }) {
  return (
    <Link href={`/authors/${author.slug}`} className="nb-author-badge">
      {author.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={author.avatarUrl} alt={author.name} className="nb-author-avatar" />
      ) : (
        <span className="nb-author-initials">
          {author.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </span>
      )}
      <span className="nb-author-name">{author.name}</span>
    </Link>
  );
}
