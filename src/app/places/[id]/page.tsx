import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlaceById, getPersonById, getPhotosByPlace } from "@/lib/data";
import PhotoCard from "@/components/PhotoCard";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlacePage({ params }: PageProps) {
  const { id } = await params;
  const place = await getPlaceById(id);
  if (!place) notFound();

  const [people, photos] = await Promise.all([
    Promise.all(
      (place.personIds ?? []).map((pid) => getPersonById(pid)),
    ).then((rs) => rs.filter(Boolean)),
    getPhotosByPlace(place.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        href="/places"
        className="text-sm text-[color:var(--accent)] hover:underline"
      >
        ← Kaikki paikat
      </Link>

      <h1 className="text-3xl font-bold mt-4">{place.name}</h1>
      {place.municipality && (
        <p className="text-[color:var(--muted)] mt-1">{place.municipality}</p>
      )}

      {place.description && (
        <p className="mt-6 leading-relaxed max-w-3xl">{place.description}</p>
      )}

      {place.lat && place.lng && (
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Koordinaatit: {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
        </p>
      )}

      {people.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Paikkaan liittyvät henkilöt</h2>
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

      {photos.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Kuvat</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((p) => (
              <PhotoCard key={p.id} photo={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
