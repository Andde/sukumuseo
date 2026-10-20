import Link from "next/link";
import { notFound } from "next/navigation";
import { getBranches, getPersons, getPlaces } from "@/lib/data";
import PersonEditor from "@/components/admin/PersonEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Henkilö · Ylläpito" };

type PageProps = { params: Promise<{ id: string }> };

// `/admin/persons/new` creates, any other id edits that person.
export default async function AdminPersonPage({ params }: PageProps) {
  const { id } = await params;
  const [persons, places, branches] = await Promise.all([
    getPersons(),
    getPlaces(),
    getBranches(),
  ]);
  const person = id === "new" ? undefined : persons.find((p) => p.id === id);
  if (id !== "new" && !person) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/admin/persons"
        className="text-sm text-[color:var(--accent)] hover:underline"
      >
        ← Henkilöt
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold">
        {person ? person.fullName : "Uusi henkilö"}
      </h1>
      <PersonEditor
        person={person}
        persons={persons
          .filter((p) => p.id !== person?.id)
          .map((p) => ({ id: p.id, name: p.fullName }))}
        places={places.map((p) => ({ id: p.id, name: p.name }))}
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}
