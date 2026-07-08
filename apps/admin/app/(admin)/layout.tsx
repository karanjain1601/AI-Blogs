import type { ReactNode } from "react";
import Link from "next/link";
import { requireSession } from "@/lib/session";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "⬡" },
  { href: "/notes", label: "Notes", icon: "📝" },
  { href: "/topics", label: "Topics", icon: "🗂" },
  { href: "/media", label: "Media", icon: "🖼" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireSession();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-[#2a2e35] bg-[#131619] flex flex-col">
        <div className="px-4 py-5 border-b border-[#2a2e35]">
          <span className="font-semibold text-white text-sm">Notes Admin</span>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#c9cdd4] hover:text-white hover:bg-[#1a1d22] rounded-lg transition-colors"
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-[#2a2e35]">
          <a
            href="/api/logout"
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#8b919a] hover:text-[#f04040] hover:bg-[#1a1d22] rounded-lg transition-colors"
          >
            <span className="text-base leading-none">↩</span>
            Sign out
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-[#0b0d10]">{children}</main>
    </div>
  );
}
