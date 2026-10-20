import {
  readBranches,
  readPersons,
  readPhotos,
  readPlaces,
  readStories,
  writeBranches,
  writePersons,
  writePhotos,
  writePlaces,
  writeStories,
} from "@/lib/storage";
import type { Person } from "@/lib/types";

export type PersonInput = Pick<
  Person,
  | "firstName"
  | "lastName"
  | "fullName"
  | "birthDate"
  | "deathDate"
  | "birthPlaceId"
  | "occupation"
  | "bio"
  | "fatherId"
  | "motherId"
  | "spouseIds"
  | "geniUrl"
  | "familyBranchId"
>;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function ids(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = [...new Set(v.filter((x): x is string => typeof x === "string" && !!x))];
  return out.length ? out : undefined;
}

// Validates a request body into the editable person fields. `selfId` (when
// editing) stops a person from being their own parent or spouse.
export function parsePersonBody(
  body: unknown,
  selfId?: string,
): PersonInput | { error: string } {
  if (!body || typeof body !== "object") return { error: "invalid body" };
  const b = body as Record<string, unknown>;
  const firstName = str(b.firstName);
  const lastName = str(b.lastName);
  if (!firstName && !lastName) return { error: "Nimi puuttuu." };
  const fatherId = str(b.fatherId) || undefined;
  const motherId = str(b.motherId) || undefined;
  const spouseIds = ids(b.spouseIds);
  if (selfId && (fatherId === selfId || motherId === selfId)) {
    return { error: "Henkilö ei voi olla oma vanhempansa." };
  }
  if (selfId && spouseIds?.includes(selfId)) {
    return { error: "Henkilö ei voi olla oma puolisonsa." };
  }
  const geniUrl = str(b.geniUrl) || undefined;
  if (geniUrl && !/^https?:\/\//i.test(geniUrl)) {
    return { error: "Geni-linkin pitää alkaa http:// tai https://." };
  }
  return {
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" "),
    birthDate: str(b.birthDate) || undefined,
    deathDate: str(b.deathDate) || undefined,
    birthPlaceId: str(b.birthPlaceId) || undefined,
    occupation: str(b.occupation) || undefined,
    bio: str(b.bio) || undefined,
    fatherId,
    motherId,
    spouseIds,
    geniUrl,
    familyBranchId: str(b.familyBranchId) || undefined,
  };
}

function without(list: string[] | undefined, id: string): string[] | undefined {
  const next = (list ?? []).filter((x) => x !== id);
  return next.length ? next : undefined;
}

function withId(list: string[] | undefined, id: string): string[] {
  return list?.includes(id) ? list : [...(list ?? []), id];
}

// Keeps the two-way links consistent after `person` was created or changed
// (`before` is its previous state, undefined for a new person): the parents'
// childrenIds and the spouses' spouseIds mirror the person's own fields.
export function syncRelations(
  persons: Person[],
  person: Person,
  before?: Person,
): Person[] {
  const parents = new Set([person.fatherId, person.motherId].filter(Boolean));
  const oldParents = new Set([before?.fatherId, before?.motherId].filter(Boolean));
  const spouses = new Set(person.spouseIds ?? []);
  const oldSpouses = new Set(before?.spouseIds ?? []);

  return persons.map((p) => {
    if (p.id === person.id) return p;
    let next = p;
    if (parents.has(p.id)) {
      next = { ...next, childrenIds: withId(next.childrenIds, person.id) };
    } else if (oldParents.has(p.id)) {
      next = { ...next, childrenIds: without(next.childrenIds, person.id) };
    }
    if (spouses.has(p.id)) {
      next = { ...next, spouseIds: withId(next.spouseIds, person.id) };
    } else if (oldSpouses.has(p.id)) {
      next = { ...next, spouseIds: without(next.spouseIds, person.id) };
    }
    return next;
  });
}

// Removes a person and every reference to them: relatives, photo tags, places,
// stories and branch roots.
export async function deletePersonEverywhere(id: string): Promise<boolean> {
  const persons = await readPersons();
  if (!persons.some((p) => p.id === id)) return false;

  await writePersons(
    persons
      .filter((p) => p.id !== id)
      .map((p) => ({
        ...p,
        fatherId: p.fatherId === id ? undefined : p.fatherId,
        motherId: p.motherId === id ? undefined : p.motherId,
        spouseIds: without(p.spouseIds, id),
        childrenIds: without(p.childrenIds, id),
      })),
  );

  const photos = await readPhotos();
  if (photos.some((p) => p.personIds?.includes(id) || p.faces?.some((f) => f.personId === id || f.suggestedPersonId === id))) {
    await writePhotos(
      photos.map((p) => ({
        ...p,
        personIds: without(p.personIds, id),
        faces: p.faces?.map((f) => ({
          ...f,
          personId: f.personId === id ? undefined : f.personId,
          suggestedPersonId:
            f.suggestedPersonId === id ? undefined : f.suggestedPersonId,
        })),
      })),
    );
  }

  const places = await readPlaces();
  if (places.some((p) => p.personIds?.includes(id))) {
    await writePlaces(
      places.map((p) => ({ ...p, personIds: without(p.personIds, id) })),
    );
  }

  const stories = await readStories();
  if (stories.some((s) => s.relatedPersons?.includes(id))) {
    await writeStories(
      stories.map((s) => ({
        ...s,
        relatedPersons: without(s.relatedPersons, id),
      })),
    );
  }

  const branches = await readBranches();
  if (branches.some((b) => b.rootPersonId === id)) {
    await writeBranches(
      branches.map((b) => ({
        ...b,
        rootPersonId: b.rootPersonId === id ? undefined : b.rootPersonId,
      })),
    );
  }
  return true;
}
