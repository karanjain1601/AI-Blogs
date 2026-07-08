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
  const { data: notes } = await (supa
    .from("notes")
    .select("*")
    .in("status", ["published", "evergreen"])
    .order("updated_at", { ascending: false }) as unknown as Promise<{
    data: unknown[] | null;
    error: unknown;
  }>);

  if (!notes) return NextResponse.json({ error: "fetch_failed" }, { status: 500 });

  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), notes }, null, 2);
  const filename = `backup-${new Date().toISOString().slice(0, 10)}.json`;

  const { error } = await supa.storage
    .from("backups")
    .upload(filename, payload, { contentType: "application/json", upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ backed_up: notes.length, filename });
}
