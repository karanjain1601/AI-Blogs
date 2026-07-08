import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@notes/core";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { title, body, slug } = (await request.json().catch(() => ({}))) as {
    title?: string;
    body?: string;
    slug?: string;
  };

  if (!title || !body) {
    return NextResponse.json(
      { error: "title and body required" },
      { status: 400 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "no_db" }, { status: 503 });

  const supa = createSupabaseClient(url, key);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tokens } = (await (supa as any)
    .from("push_tokens")
    .select("token")) as { data: { token: string }[] | null; error: unknown };

  if (!tokens?.length) return NextResponse.json({ sent: 0 });

  const messages: PushMessage[] = tokens.map(({ token }) => ({
    to: token,
    title,
    body,
    ...(slug ? { data: { slug } } : {}),
  }));

  // Expo push service (batched, max 100 per request)
  const results = await Promise.allSettled(
    chunk(messages, 100).map((batch) =>
      fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      }),
    ),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length * 100;
  return NextResponse.json({ sent: Math.min(sent, tokens.length) });
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
