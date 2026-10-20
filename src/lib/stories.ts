import type { Story } from "@/lib/types";

export type StoryInput = Omit<Story, "id">;

export function nextStoryId(stories: Story[]): string {
  const nums = stories
    .map((s) => /^story_(\d+)$/.exec(s.id)?.[1])
    .filter((n): n is string => !!n)
    .map((n) => parseInt(n, 10));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `story_${String(next).padStart(3, "0")}`;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function year(v: unknown): number | undefined {
  if (v === "" || v == null) return undefined;
  const n = Number(v);
  return Number.isInteger(n) ? n : undefined;
}

function ids(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter((x): x is string => typeof x === "string" && !!x);
  return out.length ? out : undefined;
}

// Validates a request body into story fields. The slug may still be empty;
// the routes fill it in uniquely.
export function parseStoryBody(body: unknown): StoryInput | { error: string } {
  if (!body || typeof body !== "object") return { error: "invalid body" };
  const b = body as Record<string, unknown>;
  const title = str(b.title);
  const content = typeof b.content === "string" ? b.content.trim() : "";
  if (!title) return { error: "Otsikko puuttuu." };
  if (!content) return { error: "Teksti puuttuu." };
  return {
    title,
    slug: str(b.slug),
    summary: str(b.summary) || undefined,
    content,
    yearFrom: year(b.yearFrom),
    yearTo: year(b.yearTo),
    relatedPersons: ids(b.relatedPersons),
    relatedPlaces: ids(b.relatedPlaces),
  };
}
