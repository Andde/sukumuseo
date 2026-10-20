import type { Person, Photo, Place, Story, FamilyBranch } from "@/lib/types";
import {
  readBranches,
  readPersons,
  readPhotos,
  readPlaces,
  readStories,
} from "@/lib/storage";

// All read helpers are async now — they hit disk each request so admin edits
// take effect without a rebuild. Callers must `await` them, and any page/route
// that relies on fresh data should opt out of caching
// (`export const dynamic = "force-dynamic"`).

export async function getPersons(): Promise<Person[]> {
  return readPersons();
}

export async function getPersonById(id: string): Promise<Person | undefined> {
  return (await readPersons()).find((p) => p.id === id);
}

export async function getPhotos(): Promise<Photo[]> {
  return readPhotos();
}

export async function getPhotoById(id: string): Promise<Photo | undefined> {
  return (await readPhotos()).find((p) => p.id === id);
}

export async function getPhotosByPerson(personId: string): Promise<Photo[]> {
  return (await readPhotos()).filter((p) => p.personIds?.includes(personId));
}

export async function getPhotosByPlace(placeId: string): Promise<Photo[]> {
  return (await readPhotos()).filter((p) => p.placeId === placeId);
}

export async function getPlaces(): Promise<Place[]> {
  return readPlaces();
}

export async function getPlaceById(id: string): Promise<Place | undefined> {
  return (await readPlaces()).find((p) => p.id === id);
}

export async function getStories(): Promise<Story[]> {
  return readStories();
}

export async function getStoryBySlug(slug: string): Promise<Story | undefined> {
  return (await readStories()).find((s) => s.slug === slug);
}

export async function getBranches(): Promise<FamilyBranch[]> {
  return readBranches();
}

export async function getBranchById(
  id: string,
): Promise<FamilyBranch | undefined> {
  return (await readBranches()).find((b) => b.id === id);
}

export async function getPersonsByBranch(branchId: string): Promise<Person[]> {
  return (await readPersons()).filter((p) => p.familyBranchId === branchId);
}

export async function getRecentPhotos(limit = 4): Promise<Photo[]> {
  return [...(await readPhotos())]
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    .slice(0, limit);
}

export async function getFeaturedPersons(limit = 4): Promise<Person[]> {
  return (await readPersons()).slice(0, limit);
}

export { formatLifeSpan } from "@/lib/format";
