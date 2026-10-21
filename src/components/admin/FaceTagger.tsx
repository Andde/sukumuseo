"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FaceBox } from "@/lib/types";

// face-api.js is loaded lazily so the admin bundle isn't paid on other routes,
// and so a missing model directory shows a helpful UI error instead of crashing
// the page.
type FaceApi = typeof import("face-api.js");

// Where the model weights live. Maintainer must download them once and place
// them under public/models/ — see README next to this file.
const MODEL_URL = "/models";
// Distance threshold for FaceMatcher. 0.6 is face-api's default sweet spot
// for reasonably confident matches on modern photos; old B&W scans need
// user confirmation regardless.
const MATCH_THRESHOLD = 0.6;

type Person = { id: string; name: string; faceDescriptors: number[][] };

type WorkingBox = FaceBox & { _key: string; _fresh?: boolean };

export default function FaceTagger({
  photoId,
  imageUrl,
  initialFaces,
  persons,
}: {
  photoId: string;
  imageUrl: string;
  initialFaces: FaceBox[];
  persons: Person[];
}) {
  const router = useRouter();
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [boxes, setBoxes] = useState<WorkingBox[]>(
    initialFaces.map((f, i) => ({ ...f, _key: `existing-${i}` })),
  );
  const [modelStatus, setModelStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const faceApiRef = useRef<FaceApi | null>(null);
  const [imgState, setImgState] = useState<"loading" | "ok" | "error">("loading");
  const [info, setInfo] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  } | null>(null);

  const personById = new Map(persons.map((p) => [p.id, p]));

  async function ensureModels(): Promise<FaceApi | null> {
    if (faceApiRef.current && modelStatus === "ready") return faceApiRef.current;
    setModelStatus("loading");
    setError(null);
    try {
      const faceapi = await import("face-api.js");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      faceApiRef.current = faceapi;
      setModelStatus("ready");
      return faceapi;
    } catch (e) {
      setModelStatus("error");
      setError(
        `Kasvomallia ei voitu ladata (${
          e instanceof Error ? e.message : String(e)
        }). Katso ohjeet public/models/README.txt.`,
      );
      return null;
    }
  }

  async function detect() {
    const img = imgRef.current;
    if (!img) return;
    setError(null);
    setInfo(null);
    if (imgState === "error" || (img.complete && img.naturalWidth === 0)) {
      setError("Kuvaa ei voitu ladata, joten kasvoja ei voi tunnistaa.");
      return;
    }
    if (!img.complete) {
      setError("Kuva latautuu vielä — yritä hetken kuluttua uudelleen.");
      return;
    }
    const faceapi = await ensureModels();
    if (!faceapi) return;
    setDetecting(true);
    try {
      const results = await faceapi
        .detectAllFaces(
          img,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.4 }),
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      const nW = img.naturalWidth || 1;
      const nH = img.naturalHeight || 1;

      const labeled = persons
        .filter((p) => p.faceDescriptors.length > 0)
        .map(
          (p) =>
            new faceapi.LabeledFaceDescriptors(
              p.id,
              p.faceDescriptors.map((d) => new Float32Array(d)),
            ),
        );
      const matcher = labeled.length
        ? new faceapi.FaceMatcher(labeled, MATCH_THRESHOLD)
        : null;

      const fresh: WorkingBox[] = results.map((r, i) => {
        const b = r.detection.box;
        const descriptor = Array.from(r.descriptor);
        let suggestedPersonId: string | undefined;
        let confidence: number | undefined;
        if (matcher) {
          const m = matcher.findBestMatch(r.descriptor);
          if (m.label !== "unknown") {
            suggestedPersonId = m.label;
            // face-api distance ∈ [0, ~1.4]; invert to a rough 0..1 confidence
            confidence = Math.max(0, 1 - m.distance);
          }
        }
        return {
          x: b.x / nW,
          y: b.y / nH,
          w: b.width / nW,
          h: b.height / nH,
          descriptor,
          suggestedPersonId,
          confidence,
          _key: `fresh-${Date.now()}-${i}`,
          _fresh: true,
        };
      });

      setBoxes((prev) => dedupe([...prev, ...fresh]));
      setSaved(false);
      setInfo(
        fresh.length
          ? `Löytyi ${fresh.length} kasvoa. Valitse jokaiselle henkilö ja paina Tallenna.`
          : "Malli ei löytänyt kasvoja. Piirrä laatikko kuvaan hiirellä vetämällä, niin voit merkitä kasvon käsin.",
      );
    } catch (e) {
      console.error("face detection failed", e);
      setError(
        `Tunnistus epäonnistui: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setDetecting(false);
    }
  }

  function assignPerson(key: string, personId: string) {
    setBoxes((prev) =>
      prev.map((b) => (b._key === key ? { ...b, personId: personId || undefined } : b)),
    );
    setSaved(false);
  }

  function removeBox(key: string) {
    setBoxes((prev) => prev.filter((b) => b._key !== key));
    setSaved(false);
  }

  function acceptSuggestion(key: string) {
    setBoxes((prev) =>
      prev.map((b) =>
        b._key === key && b.suggestedPersonId
          ? { ...b, personId: b.suggestedPersonId }
          : b,
      ),
    );
    setSaved(false);
  }

  function relPoint(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  }

  function onDrawStart(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = relPoint(e);
    setDraft({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  }

  function onDrawMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draft) return;
    const p = relPoint(e);
    setDraft({ ...draft, x1: p.x, y1: p.y });
  }

  function onDrawEnd() {
    if (!draft) return;
    const x = Math.min(draft.x0, draft.x1);
    const y = Math.min(draft.y0, draft.y1);
    const w = Math.abs(draft.x1 - draft.x0);
    const h = Math.abs(draft.y1 - draft.y0);
    setDraft(null);
    // Ignore stray clicks; a real face box is at least ~2% of the image.
    if (w < 0.02 || h < 0.02) return;
    setBoxes((prev) => [
      ...prev,
      { x, y, w, h, _key: `manual-${Date.now()}` },
    ]);
    setSaved(false);
    setInfo("Laatikko lisätty. Valitse sille henkilö oikealta ja paina Tallenna.");
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // First train: append each confirmed face's descriptor to that person.
      // Fresh detections carry a descriptor; pre-existing boxes don't, so
      // re-tagging an old box doesn't retrain the model with noise.
      for (const b of boxes) {
        if (b.personId && b._fresh && b.descriptor) {
          const res = await fetch(`/api/persons/${b.personId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ addFaceDescriptor: b.descriptor }),
          });
          if (!res.ok) throw new Error(await errorText(res, "Henkilön tallennus"));
        }
      }

      const faces: FaceBox[] = boxes.map((b) => ({
        x: b.x,
        y: b.y,
        w: b.w,
        h: b.h,
        personId: b.personId,
        // Keep provenance but drop the 128 floats from photos.json — those
        // live on the person now.
        suggestedPersonId: b.suggestedPersonId,
        confidence: b.confidence,
      }));
      const personIds = Array.from(
        new Set(boxes.map((b) => b.personId).filter((v): v is string => !!v)),
      );

      const res = await fetch(`/api/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faces, personIds }),
      });
      if (!res.ok) throw new Error(await errorText(res, "Kuvan tallennus"));
      setSaved(true);
      setInfo(null);
      // Refresh server data so the person/photo pages reflect the new tags.
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <div
          ref={wrapRef}
          className="relative inline-block max-w-full rounded-md border border-[color:var(--border)] overflow-hidden bg-black"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt=""
            crossOrigin="anonymous"
            onLoad={() => setImgState("ok")}
            onError={() => setImgState("error")}
            className="block max-w-full h-auto"
          />
          {/* Drag on the photo to draw a face box by hand. */}
          <div
            className="absolute inset-0 cursor-crosshair touch-none"
            onPointerDown={onDrawStart}
            onPointerMove={onDrawMove}
            onPointerUp={onDrawEnd}
            onPointerCancel={() => setDraft(null)}
          />
          {draft && (
            <div
              className="absolute border-2 border-dashed border-sky-400 pointer-events-none"
              style={{
                left: `${Math.min(draft.x0, draft.x1) * 100}%`,
                top: `${Math.min(draft.y0, draft.y1) * 100}%`,
                width: `${Math.abs(draft.x1 - draft.x0) * 100}%`,
                height: `${Math.abs(draft.y1 - draft.y0) * 100}%`,
              }}
            />
          )}
          {boxes.map((b) => {
            const person = b.personId ? personById.get(b.personId) : undefined;
            const suggested = b.suggestedPersonId
              ? personById.get(b.suggestedPersonId)
              : undefined;
            const color = person
              ? "border-green-500"
              : suggested
                ? "border-amber-400"
                : "border-red-500";
            return (
              <div
                key={b._key}
                className={`absolute border-2 ${color} pointer-events-none`}
                style={{
                  left: `${b.x * 100}%`,
                  top: `${b.y * 100}%`,
                  width: `${b.w * 100}%`,
                  height: `${b.h * 100}%`,
                }}
              >
                <span className="absolute -top-5 left-0 text-[10px] px-1 bg-black/70 text-white whitespace-nowrap">
                  {person
                    ? person.name
                    : suggested
                      ? `? ${suggested.name}${
                          b.confidence
                            ? ` (${Math.round(b.confidence * 100)}%)`
                            : ""
                        }`
                      : "tuntematon"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={detect}
            disabled={detecting || modelStatus === "loading"}
            className="px-3 py-2 rounded-md bg-[color:var(--accent)] text-white text-sm disabled:opacity-60"
          >
            {detecting
              ? "Tunnistetaan…"
              : modelStatus === "loading"
                ? "Ladataan mallia…"
                : "Tunnista kasvot"}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-3 py-2 rounded-md border border-[color:var(--border)] text-sm disabled:opacity-60"
          >
            {saving ? "Tallennetaan…" : "Tallenna"}
          </button>
          {saved && (
            <span className="text-sm text-green-600">Tallennettu ✓</span>
          )}
          {saved && (
            <>
              <Link
                href={`/photos/${photoId}`}
                className="text-sm text-[color:var(--accent)] hover:underline"
              >
                Katso kuvasivu →
              </Link>
              <Link
                href="/admin"
                className="text-sm text-[color:var(--accent)] hover:underline"
              >
                Ylläpitoon / lisää uusi kuva
              </Link>
            </>
          )}
          {error && (
            <span className="text-sm text-red-600" role="alert">
              {error}
            </span>
          )}
        </div>
        {imgState === "error" && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            Kuvaa ei voitu ladata. Tarkista, että olet kirjautunut sisään ja
            lataa sivu uudelleen.
          </p>
        )}
        {info && !error && (
          <p className="mt-2 text-sm text-[color:var(--muted)]">{info}</p>
        )}
        <p className="mt-2 text-xs text-[color:var(--muted)]">
          Vihreä laatikko = vahvistettu, keltainen = mallin ehdotus, punainen =
          tuntematon. Vedä kuvassa piirtääksesi laatikon käsin.
        </p>
      </div>

      <aside className="grid gap-3 content-start">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--muted)]">
          Kasvot ({boxes.length})
        </h2>
        {boxes.length === 0 && (
          <p className="text-sm text-[color:var(--muted)]">
            Paina &ldquo;Tunnista kasvot&rdquo; tai piirrä laatikko kuvaan
            vetämällä.
          </p>
        )}
        <ul className="grid gap-3">
          {boxes.map((b, i) => (
            <li
              key={b._key}
              className="rounded-md border border-[color:var(--border)] p-3 text-sm grid gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">#{i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeBox(b._key)}
                  className="text-xs text-red-600 hover:underline"
                >
                  poista
                </button>
              </div>
              {b.suggestedPersonId && !b.personId && (
                <div className="flex items-center justify-between gap-2 rounded bg-amber-50 dark:bg-amber-950/30 p-2 text-xs">
                  <span>
                    Ehdotus:{" "}
                    <strong>
                      {personById.get(b.suggestedPersonId)?.name ?? "?"}
                    </strong>
                    {b.confidence
                      ? ` · ${Math.round(b.confidence * 100)}%`
                      : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => acceptSuggestion(b._key)}
                    className="px-2 py-0.5 rounded bg-amber-500 text-white text-xs"
                  >
                    hyväksy
                  </button>
                </div>
              )}
              <select
                value={b.personId ?? ""}
                onChange={(e) => assignPerson(b._key, e.target.value)}
                className="px-2 py-1 rounded border border-[color:var(--border)] bg-[color:var(--card)] text-sm"
              >
                <option value="">— valitse henkilö —</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

// Two detections whose centers land in the same box are almost certainly
// duplicates from re-running detection. Keep the newest so the descriptor
// stays fresh.
function dedupe(list: WorkingBox[]): WorkingBox[] {
  const out: WorkingBox[] = [];
  for (const b of list) {
    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;
    const dup = out.findIndex((o) => {
      const ox = o.x + o.w / 2;
      const oy = o.y + o.h / 2;
      const dist = Math.hypot(bx - ox, by - oy);
      const size = Math.max(b.w, b.h, o.w, o.h);
      return dist < size * 0.5;
    });
    if (dup === -1) out.push(b);
    else out[dup] = b;
  }
  return out;
}

// Prefer the server's { error } message over a bare status code.
async function errorText(res: Response, what: string): Promise<string> {
  let detail = "";
  try {
    const text = await res.text();
    try {
      detail = (JSON.parse(text) as { error?: string }).error ?? text;
    } catch {
      detail = text;
    }
  } catch {}
  return `${what} epäonnistui (HTTP ${res.status})${
    detail ? `: ${detail.slice(0, 200)}` : ""
  }`;
}
