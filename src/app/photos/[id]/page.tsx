import Link from "next/link";
import { notFound } from "next/navigation";
import { getPhotoById, getPersonById, getPlaceById } from "@/lib/data";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PhotoPage({ params }: PageProps) {
  const { id } = await params;
  const photo = await getPhotoById(id);
  if (!photo) notFound();

  const place = photo.placeId ? await getPlaceById(photo.placeId) : undefined;
  const people = (
    await Promise.all((photo.personIds ?? []).map((pid) => getPersonById(pid)))
  ).filter(Boolean);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        href="/photos"
        className="text-sm text-[color:var(--accent)] hover:underline"
      >
        ← Kaikki kuvat
      </Link>

      <div className="mt-6">
        {photo.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.imageUrl}
            alt={photo.title}
            className="w-full rounded-md border border-[color:var(--border)]"
          />
        ) : (
          <PhotoPlaceholder label={photo.title} aspect="landscape" />
        )}
      </div>

      <div className="mt-6">
        <h1 className="text-2xl font-bold">{photo.title}</h1>
        {photo.description && (
          <p className="mt-2 text-[color:var(--muted)]">{photo.description}</p>
        )}

        <dl className="grid grid-cols-2 gap-y-2 gap-x-4 mt-6 text-sm max-w-md">
          {photo.year && (
            <>
              <dt className="text-[color:var(--muted)]">Vuosi</dt>
              <dd>{photo.year}</dd>
            </>
          )}
          {place && (
            <>
              <dt className="text-[color:var(--muted)]">Paikka</dt>
              <dd>
                <Link
                  href={`/places/${place.id}`}
                  className="text-[color:var(--accent)] hover:underline"
                >
                  {place.name}
                </Link>
              </dd>
            </>
          )}
          {photo.tags && photo.tags.length > 0 && (
            <>
              <dt className="text-[color:var(--muted)]">Aiheet</dt>
              <dd>{photo.tags.join(", ")}</dd>
            </>
          )}
        </dl>

        {people.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold mb-3">Kuvassa</h2>
            <ul className="flex flex-wrap gap-2">
              {people.map((p) =>
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
          </section>
        )}
      </div>
    </div>
  );
}
