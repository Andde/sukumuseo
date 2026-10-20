import Link from "next/link";
import { getPlaces } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paikat · Ylläpito" };

export default async function AdminPlacesPage() {
  const places = await getPlaces();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/admin"
        className="text-sm text-[color:var(--accent)] hover:underline"
      >
        ← Ylläpitoon
      </Link>
      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Paikat</h1>
        <Link
          href="/admin/places/new"
          className="px-4 py-2 rounded-md bg-[color:var(--accent)] text-white text-sm font-medium"
        >
          Uusi paikka
        </Link>
      </div>

      {places.length === 0 ? (
        <p className="mt-6 text-[color:var(--muted)]">Ei vielä paikkoja.</p>
      ) : (
        <ul className="mt-6 grid gap-2">
          {places.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/places/${p.id}`}
                className="flex items-baseline justify-between gap-4 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 hover:border-[color:var(--accent)]"
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-[color:var(--muted)]">
                  {p.municipality ?? ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
