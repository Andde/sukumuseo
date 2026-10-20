import { NextRequest, NextResponse } from "next/server";
import { nextPlaceId, readPlaces, writePlaces } from "@/lib/storage";
import { parsePlaceBody } from "@/lib/places";
import type { Place } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Auth: only the site-wide access gate in proxy.ts.
export async function POST(req: NextRequest) {
  const parsed = parsePlaceBody(await req.json().catch(() => null));
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const places = await readPlaces();
  const place: Place = { id: nextPlaceId(places), ...parsed };
  await writePlaces([...places, place]);
  return NextResponse.json({ place }, { status: 201 });
}
