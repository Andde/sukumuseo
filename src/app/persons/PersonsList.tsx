"use client";

import { useMemo, useState } from "react";
import PersonCard from "@/components/PersonCard";
import type { FamilyBranch, Person } from "@/lib/types";

type Props = {
  persons: Person[];
  branches: FamilyBranch[];
};

export default function PersonsList({ persons, branches }: Props) {
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [branch, setBranch] = useState("");

  const filtered = useMemo(() => {
    return persons.filter((p) => {
      if (name && !p.fullName.toLowerCase().includes(name.toLowerCase())) {
        return false;
      }
      if (year) {
        const y = p.birthDate?.slice(0, 4);
        if (!y || !y.includes(year)) return false;
      }
      if (branch && p.familyBranchId !== branch) return false;
      return true;
    });
  }, [persons, name, year, branch]);

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-3 mb-8 p-4 rounded-md border border-[color:var(--border)] bg-[color:var(--card)]">
        <input
          type="text"
          placeholder="Hae nimellä…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-3 py-2 rounded-md border border-[color:var(--border)] bg-[color:var(--background)]"
        />
        <input
          type="text"
          placeholder="Syntymävuosi…"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="px-3 py-2 rounded-md border border-[color:var(--border)] bg-[color:var(--background)]"
        />
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="px-3 py-2 rounded-md border border-[color:var(--border)] bg-[color:var(--background)]"
        >
          <option value="">Kaikki sukuhaarat</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[color:var(--muted)] italic">
          Ei tuloksia annetuilla hakuehdoilla.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
      )}
    </div>
  );
}
