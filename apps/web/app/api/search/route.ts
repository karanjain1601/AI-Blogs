import { type NextRequest, NextResponse } from "next/server";
import { searchNotes } from "../../../lib/data";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json([]);
  const results = await searchNotes(q);
  return NextResponse.json(results);
}
