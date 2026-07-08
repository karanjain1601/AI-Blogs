import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@notes/core";

function getRl() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const { Ratelimit } = require("@upstash/ratelimit");
  const { Redis } = require("@upstash/redis");
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(1, "30 m"),
    prefix: "web_view",
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { noteId } = body ?? {};
  if (!noteId) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "anon";
  const rl = getRl();
  if (rl) {
    const { success } = await rl.limit(`${ip}:${noteId}`);
    if (!success) return NextResponse.json({ ok: true }); // silently skip
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ ok: true });

  const supa = createSupabaseClient(url, key);
  await (supa.rpc as Function)("increment_view", { p_note_id: noteId });
  return NextResponse.json({ ok: true });
}
