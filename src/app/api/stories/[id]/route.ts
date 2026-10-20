import { NextRequest, NextResponse } from "next/server";
import { readStories, writeStories } from "@/lib/storage";
import { parseStoryBody } from "@/lib/stories";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { Story } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Replaces all editable fields of the story.
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const parsed = parseStoryBody(await req.json().catch(() => null));
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const stories = await readStories();
  const idx = stories.findIndex((s) => s.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const others = stories.filter((s) => s.id !== id).map((s) => s.slug);
  const slug = uniqueSlug(slugify(parsed.slug || parsed.title), others);
  const story: Story = { id, ...parsed, slug };
  stories[idx] = story;
  await writeStories(stories);
  return NextResponse.json({ story });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const stories = await readStories();
  if (!stories.some((s) => s.id === id)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await writeStories(stories.filter((s) => s.id !== id));
  return NextResponse.json({ ok: true });
}
