import { NextRequest, NextResponse } from "next/server";
import { readStories, writeStories } from "@/lib/storage";
import { nextStoryId, parseStoryBody } from "@/lib/stories";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { Story } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Auth: only the site-wide access gate in proxy.ts.
export async function POST(req: NextRequest) {
  const parsed = parseStoryBody(await req.json().catch(() => null));
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const stories = await readStories();
  const slug = uniqueSlug(
    slugify(parsed.slug || parsed.title),
    stories.map((s) => s.slug),
  );
  const story: Story = { id: nextStoryId(stories), ...parsed, slug };
  await writeStories([...stories, story]);
  return NextResponse.json({ story }, { status: 201 });
}
