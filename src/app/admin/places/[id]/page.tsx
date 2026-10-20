import Link from "next/link";
import { notFound } from "next/navigation";
import { getPersons, getPlaces } from "@/lib/data";
import PlaceEditor from "@/components/admin/PlaceEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paikka · Ylläpito" };

type PageProps = { params: Promise<{ id: string }> };

// `/admin/places/new` creates, any other id edits that place.
export default async function AdminPlacePage({ params }: PageProps) {
  const { id } = await params;
  const [places, persons] = await Promise.all([getPlaces(), getPersons()]);
  const place = id === "new" ? undefined : places.find((p) => p.id === id);
  if (id !== "new" && !place) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/admin/places"
        className="text-sm text-[color:var(--accent)] hover:underline"
      >
        ← Paikat
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold">
        {place ? place.name : "Uusi paikka"}
      </h1>
      <PlaceEditor
        place={place}
        persons={persons.map((p) => ({ id: p.id, name: p.fullName }))}
      />
    </div>
  );
}
