import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  nextPhotoId,
  readPhotos,
  writePhotos,
} from "@/lib/storage";
import type { Photo } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

// Multipart body: `file` (File), plus optional `title`, `description`, `year`,
// `placeId`, `personIds` (comma-separated), `tags` (comma-separated).
// TODO: auth. Family museum runs locally today; add a shared-secret header
// (`x-admin-token`) before exposing this over the network.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing file" }, { status: 400 });
  }

  const ext =
    EXT_BY_MIME[file.type] ??
    path.extname(file.name).toLowerCase() ??
    ".jpg";

  await fs.mkdir(PHOTOS_DIR, { recursive: true });
  const photos = await readPhotos();
  const id = nextPhotoId(photos);
  const filename = `${id}${ext}`;
  const abs = path.join(PHOTOS_DIR, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(abs, buf);

  const title = (form.get("title") as string | null)?.trim() || file.name;
  const description =
    (form.get("description") as string | null)?.trim() || undefined;
  const yearRaw = (form.get("year") as string | null)?.trim();
  const year = yearRaw ? Number(yearRaw) : undefined;
  const placeId =
    (form.get("placeId") as string | null)?.trim() || undefined;
  const personIds = splitCsv(form.get("personIds"));
  const tags = splitCsv(form.get("tags"));

  const photo: Photo = {
    id,
    title,
    description,
    year: Number.isFinite(year) ? year : undefined,
    imageUrl: `/photos/${filename}`,
    originalFilename: file.name,
    uploadedAt: new Date().toISOString(),
    placeId,
    personIds: personIds.length ? personIds : undefined,
    tags: tags.length ? tags : undefined,
    faces: [],
  };

  await writePhotos([...photos, photo]);
  return NextResponse.json({ photo }, { status: 201 });
}

function splitCsv(v: FormDataEntryValue | null): string[] {
  if (typeof v !== "string") return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
