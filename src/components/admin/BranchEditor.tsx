"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FamilyBranch } from "@/lib/types";

type Option = { id: string; name: string };

// Creates a family branch (no `branch` prop) or edits an existing one.
export default function BranchEditor({
  branch,
  persons,
  memberIds,
}: {
  branch?: FamilyBranch;
  persons: Option[];
  memberIds: string[];
}) {
  const router = useRouter();
  const [name, setName] = useState(branch?.name ?? "");
  const [description, setDescription] = useState(branch?.description ?? "");
  const [rootPersonId, setRootPersonId] = useState(branch?.rootPersonId ?? "");
  const [members, setMembers] = useState<Set<string>>(new Set(memberIds));
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
      router.push("/admin/branches");
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
        branch ? "PUT" : "POST",
        branch ? `/api/branches/${branch.id}` : "/api/branches",
        { name, description, rootPersonId, memberIds: [...members] },
      ),
    );
  }

  function remove() {
    if (!branch) return;
    if (
      !confirm(
        `Poistetaanko sukuhaara "${branch.name}"? Henkilöt säilyvät, mutta heidän haaransa tyhjenee.`,
      )
    ) {
      return;
    }
    return run(() => request("DELETE", `/api/branches/${branch.id}`));
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Nimi</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="esim. Tanskasten haara"
          required
          className={inputCls}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Kuvaus</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={inputCls}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="font-medium">Haaran kantaisä tai -äiti</span>
        <select
          value={rootPersonId}
          onChange={(e) => setRootPersonId(e.target.value)}
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

      <fieldset className="grid gap-2 text-sm">
        <legend className="font-medium">Haaran henkilöt</legend>
        {persons.length === 0 ? (
          <p className="text-xs text-[color:var(--muted)]">
            Ei vielä henkilöitä.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {persons.map((p) => {
              const on = members.has(p.id);
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() =>
                    setMembers((prev) => {
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
          Henkilö kuuluu yhteen haaraan kerrallaan; valinta siirtää hänet tähän
          haaraan.
        </p>
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
        {branch && (
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
