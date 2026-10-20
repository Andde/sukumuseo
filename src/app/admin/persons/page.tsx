import Link from "next/link";
import { getPersons } from "@/lib/data";
import { formatLifeSpan } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Henkilöt · Ylläpito" };

export default async function AdminPersonsPage() {
  const persons = await getPersons();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/admin"
        className="text-sm text-[color:var(--accent)] hover:underline"
      >
        ← Ylläpitoon
      </Link>
      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Henkilöt</h1>
        <Link
          href="/admin/persons/new"
          className="px-4 py-2 rounded-md bg-[color:var(--accent)] text-white text-sm font-medium"
        >
          Uusi henkilö
        </Link>
      </div>

      {persons.length === 0 ? (
        <p className="mt-6 text-[color:var(--muted)]">Ei vielä henkilöitä.</p>
      ) : (
        <ul className="mt-6 grid gap-2">
          {persons.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/persons/${p.id}`}
                className="flex items-baseline justify-between gap-4 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 hover:border-[color:var(--accent)]"
              >
                <span className="font-medium">{p.fullName}</span>
                <span className="text-xs text-[color:var(--muted)]">
                  {formatLifeSpan(p)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
