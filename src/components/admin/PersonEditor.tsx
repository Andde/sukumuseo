"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Person } from "@/lib/types";

type Option = { id: string; name: string };

// Creates a person (no `person` prop) or edits an existing one.
export default function PersonEditor({
  person,
  persons,
  places,
  branches,
}: {
  person?: Person;
  // Other people (the edited person is excluded) for parent/spouse pickers.
  persons: Option[];
  places: Option[];
  branches: Option[];
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(person?.firstName ?? "");
  const [lastName, setLastName] = useState(person?.lastName ?? "");
  const [birthDate, setBirthDate] = useState(person?.birthDate ?? "");
  const [deathDate, setDeathDate] = useState(person?.deathDate ?? "");
  const [birthPlaceId, setBirthPlaceId] = useState(person?.birthPlaceId ?? "");
  const [occupation, setOccupation] = useState(person?.occupation ?? "");
  const [bio, setBio] = useState(person?.bio ?? "");
  const [fatherId, setFatherId] = useState(person?.fatherId ?? "");
  const [motherId, setMotherId] = useState(person?.motherId ?? "");
  const [spouses, setSpouses] = useState<Set<string>>(
    new Set(person?.spouseIds ?? []),
  );
  const [familyBranchId, setFamilyBranchId] = useState(
    person?.familyBranchId ?? "",
  );
  const [geniUrl, setGeniUrl] = useState(person?.geniUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request(method: string, url: string, body?: unknown) {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(data?.error || `HTTP ${res.status}`);
    }
  }

  async function run(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      router.push("/admin/persons");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    return run(() =>
      request(
        person ? "PUT" : "POST",
        person ? `/api/persons/${person.id}` : "/api/persons",
        {
          firstName,
          lastName,
          birthDate,
          deathDate,
          birthPlaceId,
          occupation,
          bio,
          fatherId,
          motherId,
          spouseIds: [...spouses],
          familyBranchId,
          geniUrl,
        },
      ),
    );
  }

  function remove() {
    if (!person) return;
    if (
      !confirm(
        `Poistetaanko henkilö "${person.fullName}"? Hänet poistetaan myös sukulaisten, valokuvien ja tarinoiden linkeistä.`,
      )
    ) {
      return;
    }
    return run(() => request("DELETE", `/api/persons/${person.id}`));
  }

  function parentSelect(
    label: string,
    value: string,
    set: (v: string) => void,
  ) {
    return (
      <label className="grid gap-1 text-sm">
        <span className="font-medium">{label}</span>
        <select
          value={value}
          onChange={(e) => set(e.target.value)}
          className={inputCls}
        >
          <option value="">— ei valittu —</option>
          {persons.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Etunimi</span>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Sukunimi</span>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputCls}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Syntymäaika</span>
          <input
            type="text"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            placeholder="esim. 1902 tai 1902-05-14"
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Kuolinaika</span>
          <input
            type="text"
            value={deathDate}
            onChange={(e) => setDeathDate(e.target.value)}
            placeholder="esim. 1978"
            className={inputCls}
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Syntymäpaikka</span>
        <select
          value={birthPlaceId}
          onChange={(e) => setBirthPlaceId(e.target.value)}
          className={inputCls}
        >
          <option value="">— ei valittu —</option>
          {places.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Ammatti</span>
        <input
          type="text"
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          className={inputCls}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Elämäkerta</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={5}
          className={inputCls}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        {parentSelect("Isä", fatherId, setFatherId)}
        {parentSelect("Äiti", motherId, setMotherId)}
      </div>

      <fieldset className="grid gap-2 text-sm">
        <legend className="font-medium">Puoliso(t)</legend>
        {persons.length === 0 ? (
          <p className="text-xs text-[color:var(--muted)]">
            Ei muita henkilöitä.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {persons.map((p) => {
              const on = spouses.has(p.id);
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() =>
                    setSpouses((prev) => {
                      const next = new Set(prev);
                      if (next.has(p.id)) next.delete(p.id);
                      else next.add(p.id);
                      return next;
                    })
                  }
                  className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                    on
                      ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                      : "border-[color:var(--border)] hover:border-[color:var(--accent)]"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        )}
        <p className="text-xs text-[color:var(--muted)]">
          Lapset päivittyvät automaattisesti, kun heille valitaan tämä henkilö
          vanhemmaksi.
        </p>
      </fieldset>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Sukuhaara</span>
        <select
          value={familyBranchId}
          onChange={(e) => setFamilyBranchId(e.target.value)}
          className={inputCls}
        >
          <option value="">— ei valittu —</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Geni-linkki</span>
        <input
          type="url"
          value={geniUrl}
          onChange={(e) => setGeniUrl(e.target.value)}
          placeholder="https://www.geni.com/people/…"
          className={inputCls}
        />
      </label>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-md bg-[color:var(--accent)] text-white text-sm font-medium disabled:opacity-60"
        >
          {busy ? "Tallennetaan…" : "Tallenna"}
        </button>
        {person && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="px-4 py-2 rounded-md border border-red-600 text-red-600 text-sm disabled:opacity-60"
          >
            Poista
          </button>
        )}
      </div>
    </form>
  );
}

const inputCls =
  "px-3 py-2 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] text-sm focus:outline-none focus:border-[color:var(--accent)]";
