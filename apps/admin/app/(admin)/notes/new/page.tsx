import { createNoteAction } from "../actions";
import { createAdminClient } from "@/lib/supabase";

export const metadata = { title: "New note" };

async function getTopics() {
  try {
    const supa = createAdminClient();
    const { data } = await supa
      .from("topics")
      .select("id,slug,name,parent_id")
      .order("sort_order");
    return (data ?? []) as { id: string; slug: string; name: string; parent_id: string | null }[];
  } catch {
    return [];
  }
}

export default async function NewNotePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const topics = await getTopics();

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-white mb-6">New note</h1>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2 mb-4">
          {decodeURIComponent(error)}
        </p>
      )}

      <form action={createNoteAction} className="space-y-5">
        <Field label="Title" name="title" placeholder="My new note" required />
        <Field
          label="Slug"
          name="slug"
          placeholder="my-new-note"
          required
          hint="Unique identifier used in URLs. Lowercase, hyphens only."
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-[#c9cdd4]">
            Topic
          </label>
          <select
            name="topic_id"
            className="w-full px-3 py-2 bg-[#0b0d10] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5865f2] text-sm"
          >
            <option value="">— No topic —</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.parent_id ? "  ↳ " : ""}
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <Field
          label="Summary"
          name="summary"
          placeholder="Short description shown in listings"
          as="textarea"
        />

        <div className="flex gap-3">
          <button
            type="submit"
            className="px-5 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create note
          </button>
          <a
            href="/notes"
            className="px-5 py-2 bg-[#1a1d22] hover:bg-[#2a2e35] text-[#c9cdd4] text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  hint,
  as,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  as?: "textarea";
}) {
  const cls =
    "w-full px-3 py-2 bg-[#0b0d10] border border-[#2a2e35] rounded-lg text-white placeholder-[#4a5058] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent text-sm";
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-[#c9cdd4]">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {as === "textarea" ? (
        <textarea
          name={name}
          placeholder={placeholder}
          rows={3}
          className={cls + " resize-none"}
        />
      ) : (
        <input
          type="text"
          name={name}
          placeholder={placeholder}
          required={required}
          className={cls}
        />
      )}
      {hint && <p className="text-xs text-[#8b919a]">{hint}</p>}
    </div>
  );
}
