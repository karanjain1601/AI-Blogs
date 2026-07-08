import { type NextRequest, NextResponse } from "next/server";
import { getNoteBySlug } from "../../../../lib/data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note) return NextResponse.json(null, { status: 404 });
  return NextResponse.json({
    title: note.title,
    summary: note.summary,
    tags: note.tags,
    readingTime: note.readingTime,
  });
}
