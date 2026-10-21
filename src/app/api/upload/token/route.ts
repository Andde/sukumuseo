import { NextResponse } from "next/server";
import {
  handleUpload,
  handleUploadPresigned,
  type HandleUploadBody,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client";
import { issueSignedToken } from "@vercel/blob";
import { directUploadMode } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/*"];
const MAX_BYTES = 30 * 1024 * 1024;

function checkPath(pathname: string) {
  if (!pathname.startsWith("photos/")) {
    throw new Error("invalid upload path");
  }
}

// Issues what the browser needs to upload a photo straight to Vercel Blob
// (serverless request bodies are capped at 4.5 MB, too small for phone
// photos). Stores with a read-write token use client tokens; OIDC stores (only
// BLOB_STORE_ID) use presigned URLs. The route sits behind the site access gate
// in proxy.ts. No onUploadCompleted callback: Vercel's callback has no access
// cookie and /api/upload records the photo afterwards anyway.
export async function POST(request: Request) {
  const mode = directUploadMode();
  if (!mode) {
    return NextResponse.json({ error: "Blob-store ei ole käytössä." }, { status: 400 });
  }
  try {
    const body = await request.json();
    if (mode === "token") {
      const json = await handleUpload({
        body: body as HandleUploadBody,
        request,
        onBeforeGenerateToken: async (pathname) => {
          checkPath(pathname);
          return {
            allowedContentTypes: ALLOWED_TYPES,
            maximumSizeInBytes: MAX_BYTES,
            addRandomSuffix: true,
          };
        },
      });
      return NextResponse.json(json);
    }
    const json = await handleUploadPresigned({
      body: body as HandleUploadPresignedBody,
      request,
      getSignedToken: async (pathname) => {
        checkPath(pathname);
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_BYTES,
        });
        return { token };
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    console.error("upload token failed", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
