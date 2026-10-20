import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, getAccessCode } from "@/lib/access";

export function proxy(request: NextRequest) {
  const code = getAccessCode();
  if (code && request.cookies.get(ACCESS_COOKIE)?.value === code) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/access";
  url.search = "";
  url.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

// Everything is gated except the access page itself and Next's internal
// static/image assets — that includes API routes and public files like
// /photos/*.jpg so nothing leaks without the cookie.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|access).*)"],
};
