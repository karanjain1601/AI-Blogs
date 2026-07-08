import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const BUCKET = "note-assets";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

export async function POST(request: NextRequest) {
  let supa: ReturnType<typeof createAdminClient>;
  try {
    supa = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const path = `uploads/${timestamp}-${random}.${ext}`;

  const bytes = await file.arrayBuffer();
  const { error } = await supa.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supa.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: urlData.publicUrl });
}
