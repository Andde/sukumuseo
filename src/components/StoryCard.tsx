import Link from "next/link";
import type { Story } from "@/lib/types";

export default function StoryCard({ story }: { story: Story }) {
  const range =
    story.yearFrom && story.yearTo
      ? `${story.yearFrom}–${story.yearTo}`
      : story.yearFrom
        ? `${story.yearFrom}`
        : "";

  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group block rounded-md border border-[color:var(--border)] bg-[color:var(--card)] p-5 hover:shadow-md transition-shadow"
    >
      {range && (
        <p className="text-xs text-[color:var(--muted)] uppercase tracking-wide">
          {range}
        </p>
      )}
      <h3 className="text-lg font-semibold mt-1 group-hover:text-[color:var(--accent)]">
        {story.title}
      </h3>
      {story.summary && (
        <p className="text-sm mt-3 text-[color:var(--muted)] line-clamp-3">
          {story.summary}
        </p>
      )}
    </Link>
  );
}
