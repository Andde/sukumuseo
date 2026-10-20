import { NextRequest, NextResponse } from "next/server";
import { readPlaces, writePlaces } from "@/lib/storage";
import { deletePlaceEverywhere, parsePlaceBody } from "@/lib/places";
import type { Place } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Replaces the editable fields; photoIds (unused by the pages) is preserved.
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const parsed = parsePlaceBody(await req.json().catch(() => null));
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const places = await readPlaces();
  const idx = places.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const place: Place = { ...places[idx], ...parsed };
  places[idx] = place;
  await writePlaces(places);
  return NextResponse.json({ place });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!(await deletePlaceEverywhere(id))) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
