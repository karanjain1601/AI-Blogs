"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface SearchResult {
  slug: string;
  title: string;
  summary: string | null;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
        );
        const data: SearchResult[] = await res.json();
        setResults(data);
        setActiveIdx(0);
      } catch {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const close = () => setOpen(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      close();
    } else if (e.key === "Enter" && results[activeIdx]) {
      close();
      window.location.href = `/notes/${results[activeIdx].slug}`;
    }
  };

  if (!open) return null;

  return (
    <div className="nb-palette-backdrop" onClick={close} aria-hidden="true">
      <div
        className="nb-palette"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search notes"
      >
        <div className="nb-palette-header">
          <input
            ref={inputRef}
            className="nb-palette-input"
            placeholder="Search notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search query"
          />
          <button className="nb-palette-close" onClick={close} aria-label="Close">
            esc
          </button>
        </div>
        {results.length > 0 && (
          <ul className="nb-palette-results" role="listbox">
            {results.map((r, i) => (
              <li
                key={r.slug}
                role="option"
                aria-selected={i === activeIdx}
                className={
                  i === activeIdx
                    ? "nb-palette-item nb-palette-active"
                    : "nb-palette-item"
                }
              >
                <Link href={`/notes/${r.slug}`} onClick={close}>
                  <span className="nb-palette-item-title">{r.title}</span>
                  {r.summary && (
                    <span className="nb-palette-item-summary">{r.summary}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {query.trim() && results.length === 0 && (
          <p className="nb-palette-empty">No results for &ldquo;{query}&rdquo;</p>
        )}
        <div className="nb-palette-footer">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
