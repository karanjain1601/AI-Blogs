import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@notes/core";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "no_db" }, { status: 503 });

  const supa = createSupabaseClient(url, key);
  const { data: due } = await (supa
    .from("notes")
    .select("id,slug,title")
    .eq("status", "scheduled")
    .lte("publish_at", new Date().toISOString()) as unknown as Promise<{
    data: { id: string; slug: string; title: string }[] | null;
    error: unknown;
  }>);

  if (!due?.length) return NextResponse.json({ published: 0 });

  await Promise.all(
    due.map((note) =>
      (supa
        .from("notes")
        .update({ status: "published" } as never)
        .eq("id", note.id) as unknown as Promise<unknown>),
    ),
  );

  // Trigger ISR revalidation
  const revalidateUrl = process.env.WEB_REVALIDATE_URL;
  const revalidateSecret = process.env.REVALIDATE_SECRET;
  if (revalidateUrl && revalidateSecret) {
    await Promise.allSettled(
      due.map((note) =>
        fetch(revalidateUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-revalidate-secret": revalidateSecret,
          },
          body: JSON.stringify({ slug: note.slug }),
        }),
      ),
    );
  }

  return NextResponse.json({ published: due.length, slugs: due.map((n) => n.slug) });
}
