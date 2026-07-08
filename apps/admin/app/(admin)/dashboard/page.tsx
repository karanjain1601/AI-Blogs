import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import { q } from "@/lib/db";

async function getStats() {
  try {
    const supa = createAdminClient();
    const { data: notes } = await q<{ status: string }[]>(
      supa.from("notes").select("status").order("updated_at", { ascending: false }),
    );

    const counts = { draft: 0, published: 0, evergreen: 0, scheduled: 0 };
    for (const n of notes ?? []) {
      if (n.status in counts) counts[n.status as keyof typeof counts]++;
    }
    return { total: (notes ?? []).length, counts };
  } catch {
    return null;
  }
}

const STAT_COLORS: Record<string, string> = {
  draft: "text-[#8b919a]",
  scheduled: "text-yellow-400",
  published: "text-[#3fb950]",
  evergreen: "text-[#5865f2]",
};

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold text-white mb-6">Dashboard</h1>

      {stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {Object.entries(stats.counts).map(([status, count]) => (
            <div
              key={status}
              className="bg-[#131619] border border-[#2a2e35] rounded-xl p-4"
            >
              <div className={`text-2xl font-bold ${STAT_COLORS[status]}`}>
                {count}
              </div>
              <div className="text-xs text-[#8b919a] mt-1 capitalize">
                {status}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#131619] border border-[#2a2e35] rounded-xl p-4 mb-8 text-sm text-[#8b919a]">
          Connect Supabase to see stats (set{" "}
          <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          and{" "}
          <code className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code>)
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/notes/new"
          className="flex flex-col gap-1 bg-[#131619] border border-[#2a2e35] hover:border-[#5865f2] rounded-xl p-5 transition-colors"
        >
          <span className="text-2xl">📝</span>
          <span className="font-medium text-white mt-1">New note</span>
          <span className="text-xs text-[#8b919a]">Create a note</span>
        </Link>

        <Link
          href="/topics"
          className="flex flex-col gap-1 bg-[#131619] border border-[#2a2e35] hover:border-[#5865f2] rounded-xl p-5 transition-colors"
        >
          <span className="text-2xl">🗂</span>
          <span className="font-medium text-white mt-1">Topics</span>
          <span className="text-xs text-[#8b919a]">Manage topic tree</span>
        </Link>

        <Link
          href="/media"
          className="flex flex-col gap-1 bg-[#131619] border border-[#2a2e35] hover:border-[#5865f2] rounded-xl p-5 transition-colors"
        >
          <span className="text-2xl">🖼</span>
          <span className="font-medium text-white mt-1">Media</span>
          <span className="text-xs text-[#8b919a]">Upload files</span>
        </Link>
      </div>
    </div>
  );
}
