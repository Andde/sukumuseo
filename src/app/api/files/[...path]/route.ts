import { get } from "@vercel/blob";
import { blobEnabled } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Streams a private photo blob. Photos are not public blob URLs; they are only
// reachable through this route, which proxy.ts puts behind the access code.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await params;
  const valid =
    blobEnabled() &&
    parts.length >= 2 &&
    parts[0] === "photos" &&
    parts.every((p) => p && p !== "." && p !== "..");
  if (!valid) return new Response("Not found", { status: 404 });

  const res = await get(parts.join("/"), { access: "private" });
  if (!res || res.statusCode !== 200) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(res.stream, {
    headers: {
      "Content-Type": res.blob.contentType,
      // Pathnames carry a random suffix and are never overwritten.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
