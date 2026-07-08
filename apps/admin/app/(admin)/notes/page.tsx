import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-[#2a2e35] text-[#8b919a]",
  scheduled: "bg-yellow-900/40 text-yellow-300",
  published: "bg-green-900/40 text-green-300",
  evergreen: "bg-[#5865f2]/20 text-[#818cf8]",
};

async function getNotes() {
  try {
    const supa = createAdminClient();
    const { data } = await supa
      .from("notes")
      .select("id,slug,title,status,updated_at,reading_time")
      .order("updated_at", { ascending: false });
    return (data ?? []) as {
      id: string;
      slug: string;
      title: string;
      status: string;
      updated_at: string;
      reading_time: number;
    }[];
  } catch {
    return null;
  }
}

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">Notes</h1>
        <Link
          href="/notes/new"
          className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New note
        </Link>
      </div>

      {notes === null ? (
        <p className="text-[#8b919a] text-sm">
          Supabase not configured — set{" "}
          <code className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code>.
        </p>
      ) : notes.length === 0 ? (
        <p className="text-[#8b919a] text-sm">No notes yet.</p>
      ) : (
        <div className="border border-[#2a2e35] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2e35] bg-[#131619]">
                <th className="text-left px-4 py-3 text-[#8b919a] font-medium">Title</th>
                <th className="text-left px-4 py-3 text-[#8b919a] font-medium">Status</th>
                <th className="text-left px-4 py-3 text-[#8b919a] font-medium">Read time</th>
                <th className="text-left px-4 py-3 text-[#8b919a] font-medium">Updated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note, i) => (
                <tr
                  key={note.id}
                  className={`border-b border-[#2a2e35] last:border-0 ${i % 2 === 0 ? "bg-[#0b0d10]" : "bg-[#0e1013]"}`}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/notes/${note.id}`}
                      className="text-white hover:text-[#5865f2] font-medium transition-colors"
                    >
                      {note.title}
                    </Link>
                    <div className="text-[#8b919a] text-xs mt-0.5 font-mono">
                      {note.slug}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[note.status] ?? "bg-[#2a2e35] text-[#8b919a]"}`}
                    >
                      {note.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#8b919a]">
                    {note.reading_time > 0 ? `${note.reading_time} min` : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#8b919a]">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/notes/${note.id}`}
                      className="text-[#8b919a] hover:text-white text-xs transition-colors"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
