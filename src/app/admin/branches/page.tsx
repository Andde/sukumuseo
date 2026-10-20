import Link from "next/link";
import { getBranches, getPersons } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sukuhaarat · Ylläpito" };

export default async function AdminBranchesPage() {
  const [branches, persons] = await Promise.all([getBranches(), getPersons()]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/admin"
        className="text-sm text-[color:var(--accent)] hover:underline"
      >
        ← Ylläpitoon
      </Link>
      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Sukuhaarat</h1>
        <Link
          href="/admin/branches/new"
          className="px-4 py-2 rounded-md bg-[color:var(--accent)] text-white text-sm font-medium"
        >
          Uusi sukuhaara
        </Link>
      </div>

      {branches.length === 0 ? (
        <p className="mt-6 text-[color:var(--muted)]">
          Ei vielä sukuhaaroja.
        </p>
      ) : (
        <ul className="mt-6 grid gap-2">
          {branches.map((b) => {
            const count = persons.filter((p) => p.familyBranchId === b.id).length;
            return (
              <li key={b.id}>
                <Link
                  href={`/admin/branches/${b.id}`}
                  className="flex items-baseline justify-between gap-4 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 hover:border-[color:var(--accent)]"
                >
                  <span className="font-medium">{b.name}</span>
                  <span className="text-xs text-[color:var(--muted)]">
                    {count} henkilöä
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
