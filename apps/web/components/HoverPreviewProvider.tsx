"use client";
import { useEffect, useRef, useState } from "react";

interface PreviewData {
  title: string;
  summary: string | null;
  tags: string[];
  readingTime: number;
}

interface PopoverState {
  slug: string;
  data: PreviewData | null;
  loading: boolean;
  x: number;
  y: number;
}

export function HoverPreviewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const cacheRef = useRef(new Map<string, PreviewData>());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleOver = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a[data-slug]");
      if (!anchor) return;
      const slug = anchor.getAttribute("data-slug");
      if (!slug) return;

      timerRef.current = setTimeout(async () => {
        const rect = anchor.getBoundingClientRect();
        const x = Math.min(rect.left, window.innerWidth - 320);
        const y = rect.bottom + window.scrollY + 8;

        if (cacheRef.current.has(slug)) {
          setPopover({ slug, data: cacheRef.current.get(slug)!, loading: false, x, y });
          return;
        }
        setPopover({ slug, data: null, loading: true, x, y });
        try {
          const res = await fetch(`/api/note-preview/${slug}`);
          const data: PreviewData | null = res.ok ? await res.json() : null;
          if (data) cacheRef.current.set(slug, data);
          setPopover((p) =>
            p?.slug === slug ? { ...p, data, loading: false } : p,
          );
        } catch {
          setPopover((p) =>
            p?.slug === slug ? { ...p, loading: false } : p,
          );
        }
      }, 350);
    };

    const handleOut = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a[data-slug]");
      if (!anchor) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      setPopover(null);
    };

    document.addEventListener("mouseover", handleOver);
    document.addEventListener("mouseout", handleOut);
    return () => {
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseout", handleOut);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <>
      {children}
      {popover && (
        <div
          className="nb-hover-preview"
          style={{ left: popover.x, top: popover.y }}
        >
          {popover.loading ? (
            <div className="nb-hover-loading">Loading…</div>
          ) : popover.data ? (
            <>
              <div className="nb-hover-title">{popover.data.title}</div>
              {popover.data.summary && (
                <div className="nb-hover-summary">{popover.data.summary}</div>
              )}
              <div className="nb-hover-meta">
                {popover.data.readingTime > 0 &&
                  `${popover.data.readingTime} min read`}
                {popover.data.tags.length > 0 && (
                  <span className="nb-hover-tags">
                    {popover.data.tags.map((t) => (
                      <span key={t} className="nb-hover-tag">
                        {t}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </>
  );
}
