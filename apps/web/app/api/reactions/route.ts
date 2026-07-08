import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@notes/core";
import { getReactions } from "../../../lib/data";

function getRl() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const { Ratelimit } = require("@upstash/ratelimit");
  const { Redis } = require("@upstash/redis");
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "web_reaction",
  });
}

const ALLOWED_EMOJIS = ["👍", "🎉", "🔥", "💡", "❤️"];

export async function GET(request: NextRequest) {
  const noteId = request.nextUrl.searchParams.get("noteId");
  if (!noteId) return NextResponse.json([]);
  const reactions = await getReactions(noteId);
  // Fill in zeros for emojis not yet in DB
  const map = new Map(reactions.map((r) => [r.emoji, r.count]));
  return NextResponse.json(
    ALLOWED_EMOJIS.map((emoji) => ({ emoji, count: map.get(emoji) ?? 0 })),
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { noteId, emoji } = body ?? {};
  if (!noteId || !emoji || !ALLOWED_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "anon";
  const rl = getRl();
  if (rl) {
    const { success } = await rl.limit(ip);
    if (!success)
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "no_db" }, { status: 503 });

  const supa = createSupabaseClient(url, key);
  await (supa.rpc as Function)("increment_reaction", {
    p_note_id: noteId,
    p_emoji: emoji,
  });

  return NextResponse.json({ ok: true });
}
