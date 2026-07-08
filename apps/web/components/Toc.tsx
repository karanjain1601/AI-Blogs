"use client";
import { useEffect, useRef, useState } from "react";
import { buildToc } from "@notes/core";
import type { Block } from "@notes/blocks";

export function Toc({ blocks }: { blocks: Block[] }) {
  const entries = buildToc(blocks);
  const [activeId, setActiveId] = useState("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const entryKey = entries.map((e) => e.id).join(",");

  useEffect(() => {
    if (entries.length < 2) return;
    observerRef.current?.disconnect();
    const headings = entries
      .map((e) => document.getElementById(e.id))
      .filter(Boolean) as HTMLElement[];

    observerRef.current = new IntersectionObserver(
      (observed) => {
        const visible = observed
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-10% 0px -80% 0px", threshold: 0 },
    );
    headings.forEach((h) => observerRef.current!.observe(h));
    return () => observerRef.current?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryKey]);

  if (entries.length < 2) return null;

  return (
    <aside className="nb-toc" aria-label="On this page">
      <p className="nb-toc-title">On this page</p>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id} className={`nb-toc-l${entry.level}`}>
            <a
              href={`#${entry.id}`}
              className={activeId === entry.id ? "nb-toc-active" : ""}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(entry.id)?.scrollIntoView({
                  behavior: "smooth",
                });
                setActiveId(entry.id);
              }}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
