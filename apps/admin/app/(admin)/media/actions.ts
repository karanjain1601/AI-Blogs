"use server";
import { createAdminClient } from "@/lib/supabase";
import { requireSession } from "@/lib/session";

export async function uploadMediaAction(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  await requireSession();
  const supa = createAdminClient();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file provided" };

  const maxMB = 20;
  if (file.size > maxMB * 1024 * 1024) {
    return { error: `File too large (max ${maxMB} MB)` };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "bin";
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  const { error } = await supa.storage
    .from("media")
    .upload(path, uint8, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) return { error: error.message };

  const { data } = supa.storage.from("media").getPublicUrl(path);
  return { url: data.publicUrl };
}
