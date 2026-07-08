"use client";
import { useEffect } from "react";

export function ViewCounter({ noteId }: { noteId: string }) {
  useEffect(() => {
    // Only fire once per session per note
    const key = `nb_viewed_${noteId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId }),
    }).catch(() => {/* non-fatal */});
  }, [noteId]);
  return null;
}
