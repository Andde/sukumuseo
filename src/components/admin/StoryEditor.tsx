"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Story } from "@/lib/types";

type Option = { id: string; name: string };

// Creates a story (no `story` prop) or edits an existing one.
export default function StoryEditor({
  story,
  persons,
  places,
}: {
  story?: Story;
  persons: Option[];
  places: Option[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(story?.title ?? "");
  const [slug, setSlug] = useState(story?.slug ?? "");
  const [summary, setSummary] = useState(story?.summary ?? "");
  const [content, setContent] = useState(story?.content ?? "");
  const [yearFrom, setYearFrom] = useState(story?.yearFrom?.toString() ?? "");
  const [yearTo, setYearTo] = useState(story?.yearTo?.toString() ?? "");
  const [relPersons, setRelPersons] = useState<Set<string>>(
    new Set(story?.relatedPersons ?? []),
  );
  const [relPlaces, setRelPlaces] = useState<Set<string>>(
    new Set(story?.relatedPlaces ?? []),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(
    set: Set<string>,
    setter: (s: Set<string>) => void,
    id: string,
  ) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  }

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
    return res;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await request(
        story ? "PUT" : "POST",
        story ? `/api/stories/${story.id}` : "/api/stories",
        {
          title,
          slug,
          summary,
          content,
          yearFrom,
          yearTo,
          relatedPersons: [...relPersons],
          relatedPlaces: [...relPlaces],
        },
      );
      router.push("/admin/stories");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  async function remove() {
    if (!story || !confirm(`Poistetaanko tarina "${story.title}"?`)) return;
    setError(null);
    setBusy(true);
    try {
      await request("DELETE", `/api/stories/${story.id}`);
      router.push("/admin/stories");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Otsikko</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={inputCls}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Lyhyt tiivistelmä</span>
        <input
          type="text"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className={inputCls}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Teksti</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          required
          className={inputCls}
        />
        <span className="text-xs text-[color:var(--muted)]">
          Tyhjä rivi erottaa kappaleet.
        </span>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Alkuvuosi</span>
          <input
            type="number"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
            placeholder="1820"
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Loppuvuosi</span>
          <input
            type="number"
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
            placeholder="1900"
            className={inputCls}
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Osoite (valinnainen)</span>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="muodostuu otsikosta, jos tyhjä"
          className={inputCls}
        />
      </label>

      <Chips
        legend="Liittyvät henkilöt"
        options={persons}
        selected={relPersons}
        onToggle={(id) => toggle(relPersons, setRelPersons, id)}
      />
      <Chips
        legend="Liittyvät paikat"
        options={places}
        selected={relPlaces}
        onToggle={(id) => toggle(relPlaces, setRelPlaces, id)}
      />

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
        {story && (
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

function Chips({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: Option[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="grid gap-2 text-sm">
      <legend className="font-medium">{legend}</legend>
      {options.length === 0 ? (
        <p className="text-xs text-[color:var(--muted)]">Ei vielä valittavia.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const on = selected.has(o.id);
            return (
              <button
                type="button"
                key={o.id}
                onClick={() => onToggle(o.id)}
                className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                  on
                    ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                    : "border-[color:var(--border)] hover:border-[color:var(--accent)]"
                }`}
              >
                {o.name}
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

const inputCls =
  "px-3 py-2 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] text-sm focus:outline-none focus:border-[color:var(--accent)]";
