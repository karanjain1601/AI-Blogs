"use client";
import { useEffect, useState, useCallback } from "react";

interface ReactionCount {
  emoji: string;
  count: number;
}

const DEFAULT: ReactionCount[] = [
  { emoji: "👍", count: 0 },
  { emoji: "🎉", count: 0 },
  { emoji: "🔥", count: 0 },
  { emoji: "💡", count: 0 },
  { emoji: "❤️", count: 0 },
];

export function Reactions({ noteId }: { noteId: string }) {
  const [reactions, setReactions] = useState<ReactionCount[]>(DEFAULT);
  const [reacted, setReacted] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/reactions?noteId=${noteId}`)
      .then((r) => r.json())
      .then((data: ReactionCount[]) => setReactions(data))
      .catch(() => {/* non-fatal */});

    // Restore from localStorage
    try {
      const stored = localStorage.getItem(`nb_reacted_${noteId}`);
      if (stored) setReacted(new Set(JSON.parse(stored) as string[]));
    } catch {/* */}
  }, [noteId]);

  const react = useCallback(
    async (emoji: string) => {
      if (reacted.has(emoji)) return;
      const next = new Set(reacted).add(emoji);
      setReacted(next);
      setReactions((prev) =>
        prev.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r)),
      );
      try {
        localStorage.setItem(`nb_reacted_${noteId}`, JSON.stringify([...next]));
      } catch {/* */}
      await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, emoji }),
      }).catch(() => {/* non-fatal */});
    },
    [noteId, reacted],
  );

  return (
    <div className="nb-reactions">
      {reactions.map(({ emoji, count }) => (
        <button
          key={emoji}
          className={`nb-reaction${reacted.has(emoji) ? " nb-reaction-active" : ""}`}
          onClick={() => react(emoji)}
          aria-label={`React with ${emoji}`}
          title={reacted.has(emoji) ? "Already reacted" : "React"}
        >
          <span>{emoji}</span>
          {count > 0 && <span className="nb-reaction-count">{count}</span>}
        </button>
      ))}
    </div>
  );
}
