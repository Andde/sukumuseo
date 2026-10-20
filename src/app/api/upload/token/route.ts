import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Issues a short-lived token so the browser can upload a photo straight to
// Vercel Blob (serverless request bodies are capped at 4.5 MB, too small for
// phone photos). The route sits behind the site access gate in proxy.ts.
// No onUploadCompleted callback: Vercel's callback has no access cookie and
// /api/upload records the photo afterwards anyway.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("photos/")) {
          throw new Error("invalid upload path");
        }
        return {
          allowedContentTypes: ["image/*"],
          maximumSizeInBytes: 30 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
