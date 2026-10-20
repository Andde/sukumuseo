"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { upload } from "@vercel/blob/client";

type Option = { id: string; name: string };

// `direct`: upload the image from the browser straight to Vercel Blob (needed
// on Vercel, where request bodies are capped at 4.5 MB) and send only its
// pathname to /api/upload. Otherwise the file goes through /api/upload itself.
export default function UploadForm({
  persons,
  places,
  direct,
}: {
  persons: Option[];
  places: Option[];
  direct: boolean;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [selectedPersons, setSelectedPersons] = useState<Set<string>>(new Set());
  const [newPersonNames, setNewPersonNames] = useState("");
  const [newPlaceName, setNewPlaceName] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Valitse kuvatiedosto.");
      return;
    }
    const form = new FormData();
    if (title.trim()) form.set("title", title.trim());
    if (description.trim()) form.set("description", description.trim());
    if (year.trim()) form.set("year", year.trim());
    if (placeId) form.set("placeId", placeId);
    if (selectedPersons.size) {
      form.set("personIds", [...selectedPersons].join(","));
    }
    if (newPersonNames.trim()) {
      form.set("newPersonNames", newPersonNames.trim());
    }
    if (newPlaceName.trim()) form.set("newPlaceName", newPlaceName.trim());
    if (tags.trim()) form.set("tags", tags.trim());

    setBusy(true);
    try {
      if (direct) {
        const dot = file.name.lastIndexOf(".");
        const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
        const blob = await upload(`photos/photo${ext}`, file, {
          access: "private",
          handleUploadUrl: "/api/upload/token",
        });
        form.set("blobPathname", blob.pathname);
        form.set("originalFilename", file.name);
      } else {
        form.set("file", file);
      }
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      const { photo } = (await res.json()) as { photo: { id: string } };
      router.push(`/admin/photos/${photo.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function togglePerson(id: string) {
    setSelectedPersons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Kuvatiedosto</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
          className="text-sm"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Otsikko</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="esim. Kesäjuhannus Suomelan pihalla"
          className={inputCls}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Kuvaus</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={inputCls}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Vuosi</span>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="1954"
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Paikka</span>
          <select
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            className={inputCls}
          >
            <option value="">— ei valittu —</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newPlaceName}
            onChange={(e) => setNewPlaceName(e.target.value)}
            placeholder="tai kirjoita uusi paikka"
            className={inputCls}
          />
        </label>
      </div>

      <fieldset className="grid gap-2 text-sm">
        <legend className="font-medium">Kuvassa esiintyvät henkilöt</legend>
        <div className="flex flex-wrap gap-2">
          {persons.map((p) => {
            const on = selectedPersons.has(p.id);
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => togglePerson(p.id)}
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
        <input
          type="text"
          value={newPersonNames}
          onChange={(e) => setNewPersonNames(e.target.value)}
          placeholder="Uudet henkilöt nimellä, pilkulla erotettuna: Maija Virtanen, Pekka Hirvonen"
          className={inputCls}
        />
        <p className="text-xs text-[color:var(--muted)]">
          Uusi nimi luo henkilön, jos samannimistä ei vielä ole. Jos kirjoitat
          uuden paikan, se ohittaa listasta valitun. Kasvojen tarkka merkintä
          tehdään latauksen jälkeen.
        </p>
      </fieldset>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Aiheet (pilkulla erotettuna)</span>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="häät, kesä, mökki"
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
          {busy ? "Ladataan…" : "Lataa ja merkitse kasvot"}
        </button>
        {busy && (
          <span className="text-xs text-[color:var(--muted)]">
            Kuva tallennetaan…
          </span>
        )}
      </div>
    </form>
  );
}

const inputCls =
  "px-3 py-2 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] text-sm focus:outline-none focus:border-[color:var(--accent)]";
