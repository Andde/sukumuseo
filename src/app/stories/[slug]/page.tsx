import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoryBySlug, getPersonById, getPlaceById } from "@/lib/data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StoryPage({ params }: PageProps) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) notFound();

  const [persons, places] = await Promise.all([
    Promise.all(
      (story.relatedPersons ?? []).map((id) => getPersonById(id)),
    ).then((rs) => rs.filter(Boolean)),
    Promise.all(
      (story.relatedPlaces ?? []).map((id) => getPlaceById(id)),
    ).then((rs) => rs.filter(Boolean)),
  ]);

  const range =
    story.yearFrom && story.yearTo
      ? `${story.yearFrom}–${story.yearTo}`
      : story.yearFrom
        ? `${story.yearFrom}`
        : "";

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/stories"
        className="text-sm text-[color:var(--accent)] hover:underline"
      >
        ← Kaikki tarinat
      </Link>

      {range && (
        <p className="mt-4 text-sm uppercase tracking-wide text-[color:var(--muted)]">
          {range}
        </p>
      )}
      <h1 className="text-3xl font-bold mt-1">{story.title}</h1>
      {story.summary && (
        <p className="mt-3 text-lg text-[color:var(--muted)] italic">
          {story.summary}
        </p>
      )}

      <div className="mt-8 leading-relaxed whitespace-pre-line text-lg">
        {story.content}
      </div>

      {(persons.length > 0 || places.length > 0) && (
        <section className="mt-10 pt-6 border-t border-[color:var(--border)]">
          {persons.length > 0 && (
            <div className="mb-4">
              <h2 className="text-sm uppercase tracking-wide text-[color:var(--muted)] mb-2">
                Liittyvät henkilöt
              </h2>
              <ul className="flex flex-wrap gap-2">
                {persons.map((p) =>
                  p ? (
                    <li key={p.id}>
                      <Link
                        href={`/persons/${p.id}`}
                        className="px-3 py-1 rounded-full border border-[color:var(--border)] text-sm hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                      >
                        {p.fullName}
                      </Link>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          )}
          {places.length > 0 && (
            <div>
              <h2 className="text-sm uppercase tracking-wide text-[color:var(--muted)] mb-2">
                Liittyvät paikat
              </h2>
              <ul className="flex flex-wrap gap-2">
                {places.map((p) =>
                  p ? (
                    <li key={p.id}>
                      <Link
                        href={`/places/${p.id}`}
                        className="px-3 py-1 rounded-full border border-[color:var(--border)] text-sm hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                      >
                        {p.name}
                      </Link>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          )}
        </section>
      )}
    </article>
  );
}
