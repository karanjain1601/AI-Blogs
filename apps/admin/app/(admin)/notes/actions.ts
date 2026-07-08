"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";
import { q } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { runSavePipeline } from "@notes/core";
import { safeParseBlocks } from "@notes/blocks";
import type { NoteStatus } from "@notes/core";

function pipeline() {
  return {
    revalidateUrl: process.env.WEB_REVALIDATE_URL,
    revalidateSecret: process.env.REVALIDATE_SECRET,
  };
}

export async function createNoteAction(formData: FormData) {
  await requireSession();
  const supa = createAdminClient();

  const slug = (formData.get("slug") as string).trim();
  const title = (formData.get("title") as string).trim();
  const topicId = (formData.get("topic_id") as string | null) || null;
  const summary = (formData.get("summary") as string | null)?.trim() || null;
  const tags =
    (formData.get("tags") as string | null)
      ?.split(",")
      .map((t) => t.trim())
      .filter(Boolean) ?? [];

  const { data, error } = await q<{ id: string }>(
    supa
      .from("notes")
      .insert({ slug, title, topic_id: topicId, summary, tags, status: "draft", blocks: [] } as never)
      .select("id")
      .single(),
  );

  if (error || !data) {
    redirect(
      `/notes/new?error=${encodeURIComponent(error?.message ?? "Failed to create")}`,
    );
  }

  redirect(`/notes/${data!.id}`);
}

export async function updateNoteAction(noteId: string, formData: FormData) {
  await requireSession();
  const supa = createAdminClient();

  const title = (formData.get("title") as string).trim();
  const slug = (formData.get("slug") as string).trim();
  const topicId = (formData.get("topic_id") as string | null) || null;
  const summary = (formData.get("summary") as string | null)?.trim() || null;
  const icon = (formData.get("icon") as string | null)?.trim() || null;
  const coverImage = (formData.get("cover_image") as string | null)?.trim() || null;
  const tags =
    (formData.get("tags") as string | null)
      ?.split(",")
      .map((t) => t.trim())
      .filter(Boolean) ?? [];
  const blocksRaw = (formData.get("blocks") as string | null) ?? "[]";
  const aliases =
    (formData.get("aliases") as string | null)
      ?.split(",")
      .map((a) => a.trim())
      .filter(Boolean) ?? [];

  let parsedBlocks: ReturnType<typeof safeParseBlocks> | null = null;
  try {
    parsedBlocks = safeParseBlocks(JSON.parse(blocksRaw));
  } catch {
    redirect(`/notes/${noteId}?meta_error=invalid_json`);
  }
  if (!parsedBlocks?.success) {
    redirect(`/notes/${noteId}?meta_error=invalid_blocks`);
  }

  const { error } = await q<never>(
    supa
      .from("notes")
      .update({
        title, slug, topic_id: topicId, summary, icon,
        cover_image: coverImage, tags, aliases, blocks: parsedBlocks.data,
      } as never)
      .eq("id", noteId),
  );

  if (error) redirect(`/notes/${noteId}?meta_error=${encodeURIComponent(error.message)}`);

  await runSavePipeline(supa, noteId, slug, title, parsedBlocks.data, pipeline());
  revalidatePath("/notes");
  redirect(`/notes/${noteId}?saved=1`);
}

export async function updateNoteBlocksAction(
  noteId: string,
  blocksJson: string,
): Promise<{ error?: string }> {
  await requireSession();
  const supa = createAdminClient();

  const parsed = safeParseBlocks(JSON.parse(blocksJson));
  if (!parsed.success) {
    return { error: "Invalid blocks: " + parsed.error.message };
  }

  const { data: note } = await q<{ slug: string; title: string }>(
    supa.from("notes").select("slug,title").eq("id", noteId).single(),
  );
  if (!note) return { error: "Note not found" };

  const { error } = await q<never>(
    supa.from("notes").update({ blocks: parsed.data } as never).eq("id", noteId),
  );
  if (error) return { error: error.message };

  await runSavePipeline(supa, noteId, note.slug, note.title, parsed.data, pipeline());
  revalidatePath("/notes");
  return {};
}

export async function updateNoteStatusAction(
  noteId: string,
  status: NoteStatus,
): Promise<{ error?: string }> {
  await requireSession();
  const supa = createAdminClient();

  const { error } = await q<never>(
    supa.from("notes").update({ status } as never).eq("id", noteId),
  );
  if (error) return { error: error.message };
  revalidatePath("/notes");
  return {};
}

export async function deleteNoteAction(noteId: string): Promise<void> {
  await requireSession();
  const supa = createAdminClient();
  await q<never>(supa.from("notes").delete().eq("id", noteId));
  revalidatePath("/notes");
  redirect("/notes");
}
