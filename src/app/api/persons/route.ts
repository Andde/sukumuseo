import { NextRequest, NextResponse } from "next/server";
import { nextPersonId, readPersons, writePersons } from "@/lib/storage";
import { parsePersonBody, syncRelations } from "@/lib/persons";
import type { Person } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Auth: only the site-wide access gate in proxy.ts.
export async function POST(req: NextRequest) {
  const parsed = parsePersonBody(await req.json().catch(() => null));
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const persons = await readPersons();
  const known = new Set(persons.map((p) => p.id));
  const refs = [parsed.fatherId, parsed.motherId, ...(parsed.spouseIds ?? [])];
  if (refs.some((r) => r && !known.has(r))) {
    return NextResponse.json({ error: "Sukulaista ei löydy." }, { status: 400 });
  }
  const person: Person = { id: nextPersonId(persons), ...parsed };
  await writePersons([...syncRelations(persons, person), person]);
  return NextResponse.json({ person }, { status: 201 });
}
