import { NextRequest, NextResponse } from "next/server";
import { readPhotos, writePhotos } from "@/lib/storage";
import type { FaceBox, Photo } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PatchBody = Partial<
  Pick<
    Photo,
    | "title"
    | "description"
    | "year"
    | "placeId"
    | "personIds"
    | "tags"
    | "faces"
    | "imageUrl"
  >
>;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const patch = (await req.json()) as PatchBody;

  const photos = await readPhotos();
  const idx = photos.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const current = photos[idx];
  const next: Photo = { ...current, ...patch };

  if (patch.faces) next.faces = patch.faces.map(normalizeFace);
  if (patch.personIds !== undefined) {
    next.personIds = patch.personIds.length ? patch.personIds : undefined;
  }
  if (patch.tags !== undefined) {
    next.tags = patch.tags.length ? patch.tags : undefined;
  }

  photos[idx] = next;
  await writePhotos(photos);
  return NextResponse.json({ photo: next });
}

function normalizeFace(f: FaceBox): FaceBox {
  return {
    x: clamp01(f.x),
    y: clamp01(f.y),
    w: clamp01(f.w),
    h: clamp01(f.h),
    personId: f.personId,
    suggestedPersonId: f.suggestedPersonId,
    confidence: f.confidence,
    descriptor: f.descriptor,
  };
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
