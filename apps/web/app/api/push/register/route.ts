import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@notes/core";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { token, platform } = (body ?? {}) as {
    token?: unknown;
    platform?: unknown;
  };

  if (
    typeof token !== "string" ||
    !token ||
    !["ios", "android"].includes(platform as string)
  ) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: true }); // graceful no-op

  const supa = createSupabaseClient(url, key);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supa as any)
    .from("push_tokens")
    .upsert(
      { token, platform: platform as string, last_seen: new Date().toISOString() },
      { onConflict: "token" },
    );

  return NextResponse.json({ ok: true });
}
