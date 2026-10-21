import { NextRequest, NextResponse } from "next/server";
import { readPersons, writePersons } from "@/lib/storage";
import {
  deletePersonEverywhere,
  parsePersonBody,
  syncRelations,
} from "@/lib/persons";
import type { Person } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PatchBody = Partial<
  Pick<
    Person,
    | "firstName"
    | "lastName"
    | "fullName"
    | "birthDate"
    | "deathDate"
    | "birthPlaceId"
    | "occupation"
    | "bio"
    | "photoIds"
    | "familyBranchId"
    | "geniUrl"
  >
> & {
  addFaceDescriptor?: number[];
};

const MAX_DESCRIPTORS_PER_PERSON = 20;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    return await patchPerson(req, id);
  } catch (err) {
    console.error("person patch failed", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function patchPerson(req: NextRequest, id: string) {
  const patch = (await req.json().catch(() => null)) as PatchBody | null;
  if (!patch || typeof patch !== "object") {
    return NextResponse.json({ error: "Virheellinen pyyntö." }, { status: 400 });
  }

  const persons = await readPersons();
  const idx = persons.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const current = persons[idx];
  const { addFaceDescriptor, ...fields } = patch;
  const next: Person = { ...current, ...fields };

  if (addFaceDescriptor && Array.isArray(addFaceDescriptor)) {
    const existing = current.faceDescriptors ?? [];
    // Keep newest samples; older ones fall out. Model improves as more get tagged.
    const combined = [...existing, addFaceDescriptor].slice(
      -MAX_DESCRIPTORS_PER_PERSON,
    );
    next.faceDescriptors = combined;
  }

  persons[idx] = next;
  await writePersons(persons);
  return NextResponse.json({ person: next });
}

// Replaces the editable fields from the admin form. id, face descriptors,
// photoIds and childrenIds (mirrored from the children's parent fields) are
// preserved; parent/spouse links are mirrored onto the relatives.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = parsePersonBody(await req.json().catch(() => null), id);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const persons = await readPersons();
  const idx = persons.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const known = new Set(persons.map((p) => p.id));
  const refs = [parsed.fatherId, parsed.motherId, ...(parsed.spouseIds ?? [])];
  if (refs.some((r) => r && !known.has(r))) {
    return NextResponse.json(
      { error: "Sukulaista ei löydy." },
      { status: 400 },
    );
  }

  const before = persons[idx];
  const person: Person = { ...before, ...parsed };
  const synced = syncRelations(persons, person, before);
  synced[idx] = person;
  await writePersons(synced);
  return NextResponse.json({ person });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!(await deletePersonEverywhere(id))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
