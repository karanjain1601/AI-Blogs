import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import { q } from "@/lib/db";
import { NoteEditorClient } from "@/components/NoteEditorClient";
import { StatusDropdown } from "@/components/StatusDropdown";
import {
  updateNoteAction,
  updateNoteBlocksAction,
  updateNoteStatusAction,
  deleteNoteAction,
} from "../actions";
import type { Block } from "@notes/blocks";
import type { NoteStatus } from "@notes/core";

type NoteDetail = {
  id: string; slug: string; title: string; summary: string | null;
  icon: string | null; cover_image: string | null; tags: string[] | null;
  aliases: string[] | null; status: string; blocks: unknown;
  topic_id: string | null; reading_time: number; updated_at: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supa = createAdminClient();
  const { data } = await q<{ title: string }>(
    supa.from("notes").select("title").eq("id", id).single(),
  );
  return { title: data?.title ?? "Edit note" };
}

async function getNote(id: string) {
  const supa = createAdminClient();
  const { data } = await q<NoteDetail>(
    supa
      .from("notes")
      .select("id,slug,title,summary,icon,cover_image,tags,aliases,status,blocks,topic_id,reading_time,updated_at")
      .eq("id", id)
      .single(),
  );
  return data;
}

type TopicOption = { id: string; slug: string; name: string; parent_id: string | null };

async function getTopics(): Promise<TopicOption[]> {
  const supa = createAdminClient();
  const { data } = await supa
    .from("topics")
    .select("id,slug,name,parent_id")
    .order("sort_order");
  return (data ?? []) as unknown as TopicOption[];
}

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [note, topics] = await Promise.all([getNote(id), getTopics()]);
  if (!note) notFound();

  const blocks = (Array.isArray(note.blocks) ? note.blocks : []) as Block[];
  const updateMetaAction = updateNoteAction.bind(null, id);
  const deleteAction = deleteNoteAction.bind(null, id);

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-6 py-3 border-b border-[#2a2e35] bg-[#131619] flex-shrink-0">
        <Link
          href="/notes"
          className="text-[#8b919a] hover:text-white text-sm transition-colors"
        >
          ← Notes
        </Link>
        <span className="text-[#2a2e35]">/</span>
        <span className="text-white text-sm font-medium truncate">
          {note.title}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <StatusDropdown
            noteId={id}
            currentStatus={note.status as NoteStatus}
            updateAction={updateNoteStatusAction}
          />
          <form action={deleteAction}>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
            >
              Delete
            </button>
          </form>
        </div>
      </header>

      {/* Two-column: metadata sidebar + editor */}
      <div className="flex flex-1 min-h-0">
        {/* Metadata sidebar */}
        <aside className="w-72 flex-shrink-0 border-r border-[#2a2e35] bg-[#131619] overflow-y-auto">
          <form action={updateMetaAction} className="p-4 space-y-4">
            <NoteField
              label="Title"
              name="title"
              defaultValue={note.title}
              required
            />
            <NoteField
              label="Slug"
              name="slug"
              defaultValue={note.slug}
              required
              hint="URL identifier"
            />

            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#c9cdd4]">
                Topic
              </label>
              <select
                name="topic_id"
                defaultValue={note.topic_id ?? ""}
                className="w-full px-2.5 py-1.5 bg-[#0b0d10] border border-[#2a2e35] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#5865f2] text-xs"
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

            <NoteField
              label="Icon"
              name="icon"
              defaultValue={note.icon ?? ""}
              placeholder="📝"
            />
            <NoteField
              label="Summary"
              name="summary"
              defaultValue={note.summary ?? ""}
              as="textarea"
            />
            <NoteField
              label="Tags"
              name="tags"
              defaultValue={(note.tags ?? []).join(", ")}
              placeholder="tag1, tag2"
              hint="Comma-separated"
            />
            <NoteField
              label="Aliases"
              name="aliases"
              defaultValue={(note.aliases ?? []).join(", ")}
              placeholder="alt-slug"
              hint="Alternative slugs"
            />

            <div className="text-xs text-[#8b919a]">
              {note.reading_time > 0 ? `${note.reading_time} min · ` : ""}
              Updated {new Date(note.updated_at).toLocaleDateString()}
            </div>

            <button
              type="submit"
              className="w-full py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-medium rounded-lg transition-colors"
            >
              Save metadata
            </button>
          </form>
        </aside>

        {/* Blocks editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <NoteEditorClient
            noteId={id}
            initialBlocks={blocks}
            saveBlocksAction={updateNoteBlocksAction}
          />
        </div>
      </div>
    </div>
  );
}

function NoteField({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  hint,
  as,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  as?: "textarea";
}) {
  const cls =
    "w-full px-2.5 py-1.5 bg-[#0b0d10] border border-[#2a2e35] rounded-lg text-white placeholder-[#4a5058] focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent text-xs";
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-[#c9cdd4]">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {as === "textarea" ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={3}
          className={cls + " resize-none"}
        />
      ) : (
        <input
          type="text"
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          className={cls}
        />
      )}
      {hint && <p className="text-xs text-[#8b919a]">{hint}</p>}
    </div>
  );
}
