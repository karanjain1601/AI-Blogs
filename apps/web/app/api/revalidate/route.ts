import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = (await request.json()) as { slug?: string };

    // Always revalidate the home page and notes listing
    revalidatePath("/", "page");
    revalidatePath("/notes/[...slug]", "page");

    // If a specific slug is provided, target that note path too
    if (slug) {
      revalidatePath(`/notes/${slug}`, "page");
    }

    return NextResponse.json({ revalidated: true, slug });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
