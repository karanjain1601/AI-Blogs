import type { Metadata } from "next";
import type { ReactNode } from "react";
import "katex/dist/katex.min.css";
import "./globals.css";
import { getNotes, getTopics } from "../lib/data";
import { Sidebar } from "../components/Sidebar";
import { ThemeToggle } from "../components/ThemeToggle";

export const metadata: Metadata = {
  title: {
    default: "Engineering Notes",
    template: "%s · Engineering Notes",
  },
  description: "A config-driven engineering knowledge base.",
};

// Set the theme before paint to avoid a flash (dark is the default).
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
              <ThemeToggle />
            </header>
            <main className="nb-main">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
