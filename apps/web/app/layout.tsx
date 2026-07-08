import type { Metadata } from "next";
import type { ReactNode } from "react";
import "katex/dist/katex.min.css";
import "./globals.css";
import { getNotes, getTopics } from "../lib/data";
import { Sidebar } from "../components/Sidebar";
import { ThemeToggle } from "../components/ThemeToggle";
import { CommandPalette } from "../components/CommandPalette";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import { ServiceWorkerRegister } from "../components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: {
    default: "Engineering Notes",
    template: "%s · Engineering Notes",
  },
  description: "A config-driven engineering knowledge base.",
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':true;var c=document.documentElement.classList;c.toggle('dark',d);c.toggle('light',!d);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [topics, notes] = await Promise.all([getTopics(), getNotes()]);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="nb-shell">
          <Sidebar topics={topics} notes={notes} />
          <div className="nb-main-col">
            <header className="nb-header">
              <Link href="/search" className="nb-search-link">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>Search</span>
                <kbd className="nb-kbd">⌘K</kbd>
              </Link>
              <Link href="/graph" className="nb-header-link">Graph</Link>
              <ThemeToggle />
            </header>
            <main className="nb-main">{children}</main>
          </div>
        </div>
        <CommandPalette />
        <Analytics />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
