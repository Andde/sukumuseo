import { promises as fs } from "node:fs";
import path from "node:path";
import { get, put } from "@vercel/blob";
import type {
  Person,
  Photo,
  Place,
  Story,
  FamilyBranch,
} from "@/lib/types";

// Runtime-facing read/write layer. data.ts wraps these for the render path;
// admin API routes call the writers directly.
//
// Two backends, picked by whether a Blob store is configured (see blobEnabled):
//  - configured (Vercel): each collection is a private blob `data/<name>.json`.
//    Until a collection is first written, reads fall back to the bundled
//    src/data/<name>.json (the seed), so a fresh store works without a
//    migration step. After the first write the blob is the source of truth and
//    later edits to the seed files no longer show up.
//  - not configured (local dev): the src/data/*.json files are read and written
//    directly.
//
// This assumes a single writer (the maintainer using /admin). If the site ever
// runs multi-user, add locking or move to a real DB before adding concurrent
// writes.

// Newer Vercel Blob stores authenticate with OIDC (BLOB_STORE_ID plus the
// VERCEL_OIDC_TOKEN Vercel injects at runtime) and have no read-write token;
// older stores expose BLOB_READ_WRITE_TOKEN. The SDK accepts either.
export const blobEnabled = () =>
  !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

// How the browser uploads straight to Blob: "token" (client token, needs the
// read-write token), "presigned" (OIDC stores) or null (no Blob store).
export type DirectUploadMode = "token" | "presigned" | null;
export function directUploadMode(): DirectUploadMode {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "token";
  if (process.env.BLOB_STORE_ID) return "presigned";
  return null;
}

// On Vercel the filesystem is read-only, so a missing Blob store must fail
// loudly instead of falling through to the local-file backend.
export function assertWritable(): void {
  if (process.env.VERCEL && !blobEnabled()) {
    throw new Error(
      "Blob-store puuttuu: yhdistä store projektiin (BLOB_STORE_ID tai BLOB_READ_WRITE_TOKEN) ja deployaa uudelleen.",
    );
  }
}

const DATA_DIR = path.join(process.cwd(), "src", "data");

type FileMap = {
  persons: Person[];
  photos: Photo[];
  places: Place[];
  stories: Story[];
  branches: FamilyBranch[];
};

async function readJson<K extends keyof FileMap>(name: K): Promise<FileMap[K]> {
  if (blobEnabled()) {
    // useCache:false reads straight from origin so edits show up immediately.
    const res = await get(`data/${name}.json`, {
      access: "private",
      useCache: false,
    });
    if (res && res.statusCode === 200) {
      return JSON.parse(await new Response(res.stream).text()) as FileMap[K];
    }
  }
  const file = path.join(DATA_DIR, `${name}.json`);
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw) as FileMap[K];
}

async function writeJson<K extends keyof FileMap>(
  name: K,
  data: FileMap[K],
): Promise<void> {
  assertWritable();
  if (blobEnabled()) {
    await put(`data/${name}.json`, JSON.stringify(data, null, 2) + "\n", {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }
  const file = path.join(DATA_DIR, `${name}.json`);
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  // Atomic replace so a crash mid-write never leaves a truncated JSON file.
  await fs.rename(tmp, file);
}

export const readPersons = () => readJson("persons");
export const readPhotos = () => readJson("photos");
export const readPlaces = () => readJson("places");
export const readStories = () => readJson("stories");
export const readBranches = () => readJson("branches");

export const writePersons = (d: Person[]) => writeJson("persons", d);
export const writePhotos = (d: Photo[]) => writeJson("photos", d);
export const writePlaces = (d: Place[]) => writeJson("places", d);
export const writeStories = (d: Story[]) => writeJson("stories", d);
export const writeBranches = (d: FamilyBranch[]) => writeJson("branches", d);

function nextId(prefix: string, items: { id: string }[]): string {
  const re = new RegExp(`^${prefix}_(\\d+)$`);
  const nums = items
    .map((i) => re.exec(i.id)?.[1])
    .filter((n): n is string => !!n)
    .map((n) => parseInt(n, 10));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}_${String(next).padStart(3, "0")}`;
}

export const nextPhotoId = (photos: Photo[]) => nextId("photo", photos);
export const nextPersonId = (persons: Person[]) => nextId("person", persons);
export const nextPlaceId = (places: Place[]) => nextId("place", places);
