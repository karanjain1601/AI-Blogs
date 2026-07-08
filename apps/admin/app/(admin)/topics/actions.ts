"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";
import { q } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function createTopicAction(formData: FormData) {
  await requireSession();
  const supa = createAdminClient();

  const slug = (formData.get("slug") as string).trim();
  const name = (formData.get("name") as string).trim();
  const parentId = (formData.get("parent_id") as string | null) || null;
  const icon = (formData.get("icon") as string | null)?.trim() || null;
  const description =
    (formData.get("description") as string | null)?.trim() || null;

  const { error } = await q<never>(
    supa
      .from("topics")
      .insert({ slug, name, parent_id: parentId, icon, description } as never),
  );

  if (error) {
    redirect(`/topics?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/topics");
  redirect("/topics");
}

export async function updateTopicAction(
  topicId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireSession();
  const supa = createAdminClient();

  const name = (formData.get("name") as string).trim();
  const slug = (formData.get("slug") as string).trim();
  const parentId = (formData.get("parent_id") as string | null) || null;
  const icon = (formData.get("icon") as string | null)?.trim() || null;
  const description =
    (formData.get("description") as string | null)?.trim() || null;
  const sortOrder = parseInt(
    (formData.get("sort_order") as string | null) ?? "0",
    10,
  );

  const { error } = await q<never>(
    supa
      .from("topics")
      .update({ name, slug, parent_id: parentId, icon, description, sort_order: sortOrder } as never)
      .eq("id", topicId),
  );

  if (error) return { error: error.message };
  revalidatePath("/topics");
  return {};
}

export async function deleteTopicAction(topicId: string): Promise<void> {
  await requireSession();
  const supa = createAdminClient();
  await q<never>(supa.from("topics").delete().eq("id", topicId));
  revalidatePath("/topics");
  redirect("/topics");
}

export async function reorderTopicsAction(
  updates: { id: string; sort_order: number }[],
): Promise<{ error?: string }> {
  await requireSession();
  const supa = createAdminClient();

  const results = await Promise.all(
    updates.map(({ id, sort_order }) =>
      q<never>(supa.from("topics").update({ sort_order } as never).eq("id", id)),
    ),
  );

  const failed = results.find((r: { error: { message: string } | null }) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath("/topics");
  return {};
}
