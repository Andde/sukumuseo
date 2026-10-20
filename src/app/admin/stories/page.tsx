import Link from "next/link";
import { getStories } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tarinat · Ylläpito" };

export default async function AdminStoriesPage() {
  const stories = [...(await getStories())].sort(
    (a, b) => (a.yearFrom ?? 0) - (b.yearFrom ?? 0),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/admin"
        className="text-sm text-[color:var(--accent)] hover:underline"
      >
        ← Ylläpitoon
      </Link>
      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Tarinat</h1>
        <Link
          href="/admin/stories/new"
          className="px-4 py-2 rounded-md bg-[color:var(--accent)] text-white text-sm font-medium"
        >
          Uusi tarina
        </Link>
      </div>

      {stories.length === 0 ? (
        <p className="mt-6 text-[color:var(--muted)]">Ei vielä tarinoita.</p>
      ) : (
        <ul className="mt-6 grid gap-2">
          {stories.map((s) => (
            <li key={s.id}>
              <Link
                href={`/admin/stories/${s.id}`}
                className="flex items-baseline justify-between gap-4 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 hover:border-[color:var(--accent)]"
              >
                <span className="font-medium">{s.title}</span>
                <span className="text-xs text-[color:var(--muted)]">
                  {s.yearFrom
                    ? s.yearTo
                      ? `${s.yearFrom}–${s.yearTo}`
                      : s.yearFrom
                    : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
