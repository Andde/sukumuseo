import { promises as fs } from "node:fs";
import path from "node:path";
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
// This assumes a single writer (the maintainer using /admin locally). If the
// site ever runs multi-user, put a mutex or move to a real DB before adding
// concurrent writes.

const DATA_DIR = path.join(process.cwd(), "src", "data");

type FileMap = {
  persons: Person[];
  photos: Photo[];
  places: Place[];
  stories: Story[];
  branches: FamilyBranch[];
};

async function readJson<K extends keyof FileMap>(name: K): Promise<FileMap[K]> {
  const file = path.join(DATA_DIR, `${name}.json`);
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw) as FileMap[K];
}

async function writeJson<K extends keyof FileMap>(
  name: K,
  data: FileMap[K],
): Promise<void> {
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

export function nextPhotoId(photos: Photo[]): string {
  const nums = photos
    .map((p) => /^photo_(\d+)$/.exec(p.id)?.[1])
    .filter((n): n is string => !!n)
    .map((n) => parseInt(n, 10));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `photo_${String(next).padStart(3, "0")}`;
}
