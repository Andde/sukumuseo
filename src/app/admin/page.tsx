import Link from "next/link";
import { getPersons, getPlaces, getPhotos } from "@/lib/data";
import UploadForm from "@/components/admin/UploadForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ylläpito · Hirvosen sukumuseo" };

export default async function AdminPage() {
  const [persons, places, photos] = await Promise.all([
    getPersons(),
    getPlaces(),
    getPhotos(),
  ]);

  const recent = [...photos]
    .filter((p) => !!p.imageUrl)
    .sort((a, b) => (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? ""))
    .slice(0, 12);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Ylläpito</h1>
      <p className="mt-2 text-[color:var(--muted)]">
        Lisää valokuvia ja liitä niihin henkilöitä, paikkoja ja aiheita.
      </p>

      <section className="mt-8 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <h2 className="text-xl font-semibold mb-4">Uusi valokuva</h2>
        <UploadForm
          persons={persons.map((p) => ({ id: p.id, name: p.fullName }))}
          places={places.map((p) => ({ id: p.id, name: p.name }))}
        />
      </section>

      {recent.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Viimeksi lisätyt</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recent.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/photos/${p.id}`}
                  className="block rounded-md border border-[color:var(--border)] overflow-hidden hover:border-[color:var(--accent)]"
                >
                  {p.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="aspect-square w-full object-cover"
                    />
                  )}
                  <div className="p-2 text-xs">
                    <div className="font-medium truncate">{p.title}</div>
                    <div className="text-[color:var(--muted)]">
                      {p.faces?.length
                        ? `${p.faces.length} kasvoa`
                        : "Merkitse kasvot →"}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
