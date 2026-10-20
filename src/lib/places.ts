import {
  readPersons,
  readPhotos,
  readPlaces,
  readStories,
  writePersons,
  writePhotos,
  writePlaces,
  writeStories,
} from "@/lib/storage";
import type { Place } from "@/lib/types";

export type PlaceInput = Pick<
  Place,
  "name" | "municipality" | "lat" | "lng" | "description" | "personIds"
>;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

// Accepts a number or text with a decimal comma ("62,6010"); empty means unset.
function coord(v: unknown, min: number, max: number): number | undefined | null {
  if (v === "" || v == null) return undefined;
  const n = typeof v === "number" ? v : Number(String(v).trim().replace(",", "."));
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

export function parsePlaceBody(body: unknown): PlaceInput | { error: string } {
  if (!body || typeof body !== "object") return { error: "invalid body" };
  const b = body as Record<string, unknown>;
  const name = str(b.name);
  if (!name) return { error: "Nimi puuttuu." };
  const lat = coord(b.lat, -90, 90);
  const lng = coord(b.lng, -180, 180);
  if (lat === null) return { error: "Leveysaste on virheellinen." };
  if (lng === null) return { error: "Pituusaste on virheellinen." };
  if ((lat === undefined) !== (lng === undefined)) {
    return { error: "Anna sekä leveys- että pituusaste, tai kumpikaan." };
  }
  const personIds = Array.isArray(b.personIds)
    ? [...new Set(b.personIds.filter((x): x is string => typeof x === "string" && !!x))]
    : [];
  return {
    name,
    municipality: str(b.municipality) || undefined,
    lat,
    lng,
    description: str(b.description) || undefined,
    personIds: personIds.length ? personIds : undefined,
  };
}

// Removes a place and clears every reference to it.
export async function deletePlaceEverywhere(id: string): Promise<boolean> {
  const places = await readPlaces();
  if (!places.some((p) => p.id === id)) return false;
  await writePlaces(places.filter((p) => p.id !== id));

  const photos = await readPhotos();
  if (photos.some((p) => p.placeId === id)) {
    await writePhotos(
      photos.map((p) => (p.placeId === id ? { ...p, placeId: undefined } : p)),
    );
  }

  const persons = await readPersons();
  if (persons.some((p) => p.birthPlaceId === id)) {
    await writePersons(
      persons.map((p) =>
        p.birthPlaceId === id ? { ...p, birthPlaceId: undefined } : p,
      ),
    );
  }

  const stories = await readStories();
  if (stories.some((s) => s.relatedPlaces?.includes(id))) {
    await writeStories(
      stories.map((s) => {
        const next = (s.relatedPlaces ?? []).filter((x) => x !== id);
        return { ...s, relatedPlaces: next.length ? next : undefined };
      }),
    );
  }
  return true;
}
