"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Place } from "@/lib/types";

type Option = { id: string; name: string };

// Creates a place (no `place` prop) or edits an existing one.
export default function PlaceEditor({
  place,
  persons,
}: {
  place?: Place;
  persons: Option[];
}) {
  const router = useRouter();
  const [name, setName] = useState(place?.name ?? "");
  const [municipality, setMunicipality] = useState(place?.municipality ?? "");
  const [lat, setLat] = useState(place?.lat != null ? String(place.lat) : "");
  const [lng, setLng] = useState(place?.lng != null ? String(place.lng) : "");
  const [description, setDescription] = useState(place?.description ?? "");
  const [people, setPeople] = useState<Set<string>>(
    new Set(place?.personIds ?? []),
  );
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
      router.push("/admin/places");
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
        place ? "PUT" : "POST",
        place ? `/api/places/${place.id}` : "/api/places",
        { name, municipality, lat, lng, description, personIds: [...people] },
      ),
    );
  }

  function remove() {
    if (!place) return;
    if (
      !confirm(
        `Poistetaanko paikka "${place.name}"? Valokuvat ja henkilöt säilyvät, mutta niiden paikkaviittaus tyhjenee.`,
      )
    ) {
      return;
    }
    return run(() => request("DELETE", `/api/places/${place.id}`));
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Nimi</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="esim. Virsto"
          required
          className={inputCls}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Kunta</span>
        <input
          type="text"
          value={municipality}
          onChange={(e) => setMunicipality(e.target.value)}
          className={inputCls}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Leveysaste</span>
          <input
            type="text"
            inputMode="decimal"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="esim. 62,6010"
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Pituusaste</span>
          <input
            type="text"
            inputMode="decimal"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="esim. 29,7636"
            className={inputCls}
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Kuvaus</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={inputCls}
        />
      </label>

      <fieldset className="grid gap-2 text-sm">
        <legend className="font-medium">Paikkaan liittyvät henkilöt</legend>
        {persons.length === 0 ? (
          <p className="text-xs text-[color:var(--muted)]">
            Ei vielä henkilöitä.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {persons.map((p) => {
              const on = people.has(p.id);
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() =>
                    setPeople((prev) => {
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
      </fieldset>

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
        {place && (
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
