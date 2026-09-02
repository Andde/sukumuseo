import { NextRequest, NextResponse } from "next/server";
import { readPersons, writePersons } from "@/lib/storage";
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
  const patch = (await req.json()) as PatchBody;

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
