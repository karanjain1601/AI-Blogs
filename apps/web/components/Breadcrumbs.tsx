import Link from "next/link";
import type { TopicView } from "../lib/types";

export function Breadcrumbs({
  chain,
  title,
}: {
  chain: TopicView[];
  title?: string;
}) {
  return (
    <nav className="nb-breadcrumbs" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      {chain.map((topic) => (
        <span key={topic.slug}>
          <span className="nb-sep">›</span>
          <Link href={`/topics/${topic.slug}`}>{topic.name}</Link>
        </span>
      ))}
      {title ? (
        <span>
          <span className="nb-sep">›</span>
          <span aria-current="page">{title}</span>
        </span>
      ) : null}
    </nav>
  );
}
