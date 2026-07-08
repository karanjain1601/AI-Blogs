"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    const classes = document.documentElement.classList;
    classes.toggle("dark", next);
    classes.toggle("light", !next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage unavailable */
    }
    // Let theme-aware client blocks (e.g. Mermaid) re-render.
    window.dispatchEvent(new Event("themechange"));
  }

  return (
    <button
      type="button"
      className="nb-theme-toggle"
      onClick={toggle}
      aria-label="Toggle color theme"
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}
